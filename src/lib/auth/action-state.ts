export interface AuthActionState {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
}

export const initialAuthActionState: AuthActionState = { status: "idle" };
