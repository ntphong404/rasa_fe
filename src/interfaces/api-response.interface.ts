interface APIResponse<T> {
  message: string;
  data: T;
  success: boolean;
}