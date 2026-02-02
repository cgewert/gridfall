export const NetEvents = {
  welcome: "net:welcome",
  loginOk: "net:login-ok",
  loginFailed: "net:login-failed",

  joinedRoom: "net:joined-room",

  leftRoom: "net:left-room",

  roomState: "net:room-state",

  roomCreated: "net:room-created",

  disconnected: "net:disconnected",
} as const;

export type NetEventKey = (typeof NetEvents)[keyof typeof NetEvents];
