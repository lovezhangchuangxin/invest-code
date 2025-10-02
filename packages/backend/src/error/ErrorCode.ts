export class ErrorCode {
  constructor(public code: number, public msg: string) {}

  getCode() {
    return this.code
  }

  getMsg() {
    return this.msg
  }

  static PARAM_ERROR = new ErrorCode(400, '参数错误')
  static ROLE_ERROR = new ErrorCode(403, '角色权限错误')
  static SERVER_ERROR = new ErrorCode(500, '服务器错误')
  static UNKNOWN_ERROR = new ErrorCode(900, '未知错误')
  static ILLEGAL_OPERATION = new ErrorCode(901, '非法操作')

  static USER_EXIST = new ErrorCode(1001, '用户已存在')
  static USER_NOT_EXIST = new ErrorCode(1002, '用户不存在')
  static USERNAME_OR_PASSWORD_ERROR = new ErrorCode(1003, '用户名或密码错误')
  static TOKEN_INVALID = new ErrorCode(1004, 'token 无效 或 过期')
  static VERIFICATION_ERROR = new ErrorCode(1005, '验证码错误')
  static SEND_MAIL_ERROR = new ErrorCode(1006, '发送邮件失败')
  static NO_PERMISSION = new ErrorCode(1007, '没有权限')
  static UNIVERSE_NOT_EXIST = new ErrorCode(1008, '宇宙不存在')
  static NOT_IN_SAFE_MODE = new ErrorCode(1009, '未处于安全模式')
  static SAFE_MODE_NOT_EXPIRED = new ErrorCode(1010, '安全模式未到期')
  static ALREADY_IN_SAFE_MODE = new ErrorCode(1011, '已处于安全模式')
  static SAFE_MODE_NOT_ENOUGH = new ErrorCode(1012, '安全模式次数不足')
  static USER_BAN = new ErrorCode(1013, '用户被封禁')
  static NOT_BAN_ADMIN = new ErrorCode(1014, '不能封禁管理员')
  static PAGE_SIZE_TOO_LARGE = new ErrorCode(1015, '每页大小过大')
  static VERIFICATION_CODE_SEND_FAILED = new ErrorCode(
    1016,
    '验证码发送失败，请联系管理员解决',
  )
  static SCRIPT_TOO_LONG = new ErrorCode(2001, '脚本长度过长')
}
