//! AI service — generation, refinement, classification.
//!
//! The Electron version used Vercel AI SDK (OpenAI/Anthropic SDK wrappers).
//! Tauri side keeps the same JSON contract but makes raw HTTP calls so we
//! don't need a Node runtime.

use std::collections::HashMap;
use std::sync::Mutex;

use reqwest;
use serde_json::json;

use crate::error::{AppError, AppResult};
use crate::models::{
    AiClassifyRequest, AiClassifyResponse, AiClassifySuggestion, AiGenerateRequest, AiGenerateResponse,
    AiProvider, AiRefineRequest, AiRefineResponse,
};

const VALID_ACTIONS: &[&str] = &[
    "polish", "shorten", "expand", "formalize", "casualize", "translate",
];

fn action_prompt(action: &str) -> &'static str {
    match action {
        "polish" => "Improve the writing quality while keeping the same meaning. Fix grammar and style issues:",
        "shorten" => "Make this more concise while keeping the key points:",
        "expand" => "Expand on this content with more details and context:",
        "formalize" => "Rewrite this in a professional, formal tone suitable for business communication:",
        "casualize" => "Rewrite this in a friendly, casual tone:",
        "translate" => "Translate this text accurately:",
        _ => "Improve the following text:",
    }
}

pub struct AiService {
    default_provider: Mutex<String>,
    api_keys: Mutex<HashMap<String, String>>,
    configured: Mutex<HashMap<String, bool>>,
    ollama_url: Mutex<String>,
}

impl AiService {
    pub fn new() -> Self {
        let mut configured = HashMap::new();
        configured.insert("openai".into(), std::env::var("OPENAI_API_KEY").is_ok());
        Self {
            default_provider: Mutex::new("openai".into()),
            api_keys: Mutex::new(HashMap::new()),
            configured: Mutex::new(configured),
            ollama_url: Mutex::new("http://localhost:11434".into()),
        }
    }

    pub fn set_default_provider(&self, provider: &str) -> AppResult<()> {
        let cfg = self.configured.lock().unwrap();
        if !cfg.get(provider).copied().unwrap_or(false) {
            return Err(AppError::AiProviderUnavailable);
        }
        drop(cfg);
        let mut dp = self.default_provider.lock().unwrap();
        *dp = provider.into();
        Ok(())
    }

    pub fn configure_provider(&self, provider_id: &str, api_key: Option<String>, ollama_url: Option<String>) {
        let mut keys = self.api_keys.lock().unwrap();
        let mut cfg = self.configured.lock().unwrap();
        if let Some(key) = api_key {
            keys.insert(provider_id.into(), key);
            cfg.insert(provider_id.into(), true);
        }
        if provider_id == "ollama" {
            if let Some(url) = ollama_url {
                let mut ou = self.ollama_url.lock().unwrap();
                *ou = url;
            }
            cfg.insert("ollama".into(), true);
        }
    }

    // ── Generate ─────────────────────────────────────────────────────────

    pub async fn generate(&self, request: AiGenerateRequest) -> AppResult<AiGenerateResponse> {
        if request.prompt.trim().is_empty() {
            return Err(AppError::Internal("AI_EMPTY_PROMPT".into()));
        }
        let provider = request.provider.unwrap_or_else(|| {
            self.default_provider.lock().unwrap().clone()
        });
        let is_configured = {
            let cfg = self.configured.lock().unwrap();
            cfg.get(&provider).copied().unwrap_or(false)
        };
        if !is_configured {
            return Err(AppError::AiProviderUnavailable);
        }

        let system = request.agent_id.map(|id| {
            format!("You are an AI email assistant specialized in {}. Help the user write professional and effective emails.", id)
        }).unwrap_or_else(|| "You are a helpful AI assistant specialized in email composition. Write clear, professional, and effective emails.".into());

        match provider.as_str() {
            "openai" => self.call_openai(&system, &request.prompt, request.model, request.max_tokens).await,
            "claude" => self.call_claude(&system, &request.prompt, request.model, request.max_tokens).await,
            "ollama" => self.call_ollama(&system, &request.prompt, request.model).await,
            _ => Err(AppError::AiProviderUnavailable),
        }
    }

    // ── Refine ───────────────────────────────────────────────────────────

    pub async fn refine(&self, request: AiRefineRequest) -> AppResult<AiRefineResponse> {
        if request.content.trim().is_empty() {
            return Err(AppError::Internal("AI_EMPTY_CONTENT".into()));
        }
        if !VALID_ACTIONS.contains(&request.action.as_str()) {
            return Err(AppError::Internal("AI_INVALID_ACTION".into()));
        }
        let base = action_prompt(&request.action);
        let full_prompt = if let Some(lang) = &request.target_language {
            format!("{}\n\nTarget language: {}\n\nContent:\n{}", base, lang, request.content)
        } else if let Some(inst) = &request.instructions {
            format!("{}\n\nAdditional instructions: {}\n\nContent:\n{}", base, inst, request.content)
        } else {
            format!("{}\n\n{}", base, request.content)
        };

        let resp = self
            .call_openai(
                "You are an expert at editing and improving text. Provide high-quality revisions.",
                &full_prompt,
                None,
                None,
            )
            .await?;

        Ok(AiRefineResponse {
            content: resp.content,
            diff: format!("Text {}d successfully", request.action),
            tokens_used: resp.tokens_used,
        })
    }

    // ── Classify ─────────────────────────────────────────────────────────

    pub async fn classify(&self, request: AiClassifyRequest) -> AppResult<AiClassifyResponse> {
        if request.available_tags.is_empty() {
            return Ok(AiClassifyResponse { suggestions: vec![] });
        }
        let tags_desc = request
            .available_tags
            .iter()
            .map(|t| {
                format!("- {}{}", t.name, t.description.as_deref().map(|d| format!(": {}", d)).unwrap_or_default())
            })
            .collect::<Vec<_>>()
            .join("\n");
        let prompt = format!(
            "Analyze this email and suggest relevant tags from the available list.\n\nAvailable tags:\n{}\n\nEmail content:\n{}\n\nFor each matching tag, provide:\n1. The tag ID\n2. Confidence score (0-1)\n3. Brief reason for the match\n\nOnly include tags with confidence >= 0.6. Format as JSON array.",
            tags_desc,
            request.email_content.as_deref().unwrap_or("").chars().take(2000).collect::<String>()
        );

        let resp = self
            .call_openai(
                "You are an expert at email classification and organization. Respond only with valid JSON.",
                &prompt,
                None,
                Some(1000),
            )
            .await;

        let text = match resp {
            Ok(r) => r.content,
            Err(_) => return Ok(AiClassifyResponse { suggestions: vec![] }),
        };

        let suggestions: Vec<AiClassifySuggestion> = match serde_json::from_str::<Vec<serde_json::Value>>(&text) {
            Ok(arr) => arr
                .into_iter()
                .filter_map(|v| {
                    let confidence = v.get("confidence")?.as_f64()?;
                    if confidence < 0.6 {
                        return None;
                    }
                    let tag_id = v.get("tagId")?.as_str()?.to_string();
                    let tag_name = request
                        .available_tags
                        .iter()
                        .find(|t| t.id == tag_id)
                        .map(|t| t.name.clone())
                        .unwrap_or_default();
                    Some(AiClassifySuggestion {
                        tag_id,
                        tag_name,
                        confidence,
                        reason: v.get("reason").and_then(|r| r.as_str()).unwrap_or("AI matched content to tag").into(),
                    })
                })
                .collect(),
            Err(_) => vec![],
        };

        Ok(AiClassifyResponse { suggestions })
    }

    // ── Providers ────────────────────────────────────────────────────────

    pub fn get_providers(&self) -> Vec<AiProvider> {
        let keys = self.api_keys.lock().unwrap();
        let cfg = self.configured.lock().unwrap();
        let openai_key = keys.get("openai").cloned().or_else(|| std::env::var("OPENAI_API_KEY").ok());
        let anthropic_key = keys.get("claude").cloned().or_else(|| std::env::var("ANTHROPIC_API_KEY").ok());

        vec![
            AiProvider {
                id: "openai".into(),
                name: "OpenAI".into(),
                is_configured: openai_key.is_some(),
                is_local: false,
                models: vec!["gpt-4o".into(), "gpt-4o-mini".into(), "gpt-3.5-turbo".into()],
            },
            AiProvider {
                id: "claude".into(),
                name: "Claude (Anthropic)".into(),
                is_configured: anthropic_key.is_some() || cfg.get("claude").copied().unwrap_or(false),
                is_local: false,
                models: vec![
                    "claude-3-opus-20240229".into(),
                    "claude-3-sonnet-20240229".into(),
                    "claude-3-haiku-20240307".into(),
                ],
            },
            AiProvider {
                id: "ollama".into(),
                name: "Ollama (Local)".into(),
                is_configured: cfg.get("ollama").copied().unwrap_or(false),
                is_local: true,
                models: vec!["llama3".into(), "mistral".into(), "codellama".into(), "phi3".into()],
            },
        ]
    }

    // ── Internal HTTP callers ────────────────────────────────────────────

    async fn call_openai(
        &self,
        system: &str,
        prompt: &str,
        model: Option<String>,
        max_tokens: Option<u32>,
    ) -> AppResult<AiGenerateResponse> {
        let key = {
            let keys = self.api_keys.lock().unwrap();
            keys.get("openai")
                .cloned()
                .or_else(|| std::env::var("OPENAI_API_KEY").ok())
        }
        .ok_or_else(|| AppError::Internal("AI_API_KEY_MISSING".into()))?;

        let client = reqwest::Client::new();
        let resp = client
            .post("https://api.openai.com/v1/chat/completions")
            .header("Authorization", format!("Bearer {}", key))
            .json(&json!({
                "model": model.unwrap_or_else(|| "gpt-4o-mini".into()),
                "messages": [
                    { "role": "system", "content": system },
                    { "role": "user", "content": prompt }
                ],
                "temperature": 0.7,
                "max_tokens": max_tokens.unwrap_or(2000),
            }))
            .send()
            .await
            .map_err(|_| AppError::AiProviderUnavailable)?;

        if resp.status().as_u16() == 429 {
            return Err(AppError::AiRateLimited);
        }
        let json: serde_json::Value = resp
            .json()
            .await
            .map_err(|e| AppError::Internal(e.to_string()))?;

        let content = json["choices"][0]["message"]["content"]
            .as_str()
            .unwrap_or("")
            .to_string();
        let tokens_used = json["usage"]["total_tokens"].as_u64().unwrap_or(0) as u32;

        Ok(AiGenerateResponse {
            content,
            tokens_used,
            provider: "openai".into(),
        })
    }

    async fn call_claude(
        &self,
        system: &str,
        prompt: &str,
        model: Option<String>,
        max_tokens: Option<u32>,
    ) -> AppResult<AiGenerateResponse> {
        let key = {
            let keys = self.api_keys.lock().unwrap();
            keys.get("claude")
                .cloned()
                .or_else(|| std::env::var("ANTHROPIC_API_KEY").ok())
        }
        .ok_or_else(|| AppError::Internal("AI_API_KEY_MISSING".into()))?;

        let client = reqwest::Client::new();
        let resp = client
            .post("https://api.anthropic.com/v1/messages")
            .header("x-api-key", &key)
            .header("anthropic-version", "2023-06-01")
            .json(&json!({
                "model": model.unwrap_or_else(|| "claude-3-sonnet-20240229".into()),
                "system": system,
                "messages": [{ "role": "user", "content": prompt }],
                "max_tokens": max_tokens.unwrap_or(2000),
            }))
            .send()
            .await
            .map_err(|_| AppError::AiProviderUnavailable)?;

        if resp.status().as_u16() == 429 {
            return Err(AppError::AiRateLimited);
        }
        let json: serde_json::Value = resp
            .json()
            .await
            .map_err(|e| AppError::Internal(e.to_string()))?;

        let content = json["content"][0]["text"]
            .as_str()
            .unwrap_or("")
            .to_string();
        let tokens_used = json["usage"]["input_tokens"].as_u64().unwrap_or(0) as u32
            + json["usage"]["output_tokens"].as_u64().unwrap_or(0) as u32;

        Ok(AiGenerateResponse {
            content,
            tokens_used,
            provider: "claude".into(),
        })
    }

    async fn call_ollama(
        &self,
        system: &str,
        prompt: &str,
        model: Option<String>,
    ) -> AppResult<AiGenerateResponse> {
        let url = self.ollama_url.lock().unwrap().clone();
        let client = reqwest::Client::new();
        let resp = client
            .post(format!("{}/api/generate", url))
            .json(&json!({
                "model": model.unwrap_or_else(|| "llama3".into()),
                "prompt": format!("{}\n\nUser: {}\n\nAssistant:", system, prompt),
                "stream": false,
            }))
            .send()
            .await
            .map_err(|_| AppError::AiProviderUnavailable)?;

        let json: serde_json::Value = resp
            .json()
            .await
            .map_err(|e| AppError::Internal(e.to_string()))?;

        let content = json["response"].as_str().unwrap_or("").to_string();
        let tokens_used = json["eval_count"].as_u64().unwrap_or(0) as u32;

        Ok(AiGenerateResponse {
            content,
            tokens_used,
            provider: "ollama".into(),
        })
    }
}
