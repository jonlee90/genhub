// KakaoTalk Integration Types (via Sendbird)

export interface KakaoConnection {
  id: string;
  user_id: string;
  kakao_user_id: string;
  sendbird_user_id: string;
  two_way_sync: boolean;
  connected_at: string;
  disconnected_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AlimTalkTemplate {
  template: 'task_assignment' | 'project_milestone';
  params: Record<string, string>;
}

export interface SendbirdMessage {
  message_id: string;
  channel_url: string;
  user_id: string;
  message: string;
  created_at: number;
  custom_type?: string;
  data?: string;
}

export interface SendbirdWebhookPayload {
  category: string;
  app_id: string;
  channel: {
    channel_url: string;
    name: string;
    custom_type: string;
  };
  sender: {
    user_id: string;
    nickname: string;
    profile_url?: string;
  };
  payload: {
    message_id: number;
    message: string;
    created_at: number;
    custom_type?: string;
    data?: string;
  };
  sdk_version: string;
  members?: Array<{
    user_id: string;
    nickname: string;
  }>;
}

export interface SendbirdTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  token_type: string;
  user_id: string;
}

export interface AlimTalkSendResult {
  success: boolean;
  message_id?: string;
  error?: string;
  retry_count?: number;
}
