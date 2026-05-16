use std::sync::Arc;

use tauri::State;

use crate::error::AppResult;
use crate::models::{
    AiClassifyRequest, AiClassifyResponse, AiGenerateRequest, AiGenerateResponse,
    AiProvider, AiRefineRequest, AiRefineResponse, ConfigureProviderRequest,
};
use crate::services::ai::AiService;
use crate::state::AppState;

fn service() -> AiService {
    AiService::new()
}

#[tauri::command(rename_all = "camelCase")]
pub async fn ai_generate(request: AiGenerateRequest) -> AppResult<AiGenerateResponse> {
    service().generate(request).await
}

#[tauri::command(rename_all = "camelCase")]
pub async fn ai_refine(request: AiRefineRequest) -> AppResult<AiRefineResponse> {
    service().refine(request).await
}

#[tauri::command(rename_all = "camelCase")]
pub async fn ai_classify_email(request: AiClassifyRequest) -> AppResult<AiClassifyResponse> {
    service().classify(request).await
}

#[tauri::command(rename_all = "camelCase")]
pub fn ai_providers() -> Vec<AiProvider> {
    service().get_providers()
}

#[tauri::command(rename_all = "camelCase")]
pub fn ai_configure_provider(request: ConfigureProviderRequest) {
    service().configure_provider(
        &request.provider_id,
        request.api_key,
        request.base_url,
    );
}
