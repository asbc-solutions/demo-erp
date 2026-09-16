/**
 * Command Center is gated behind a single bare resource slug — no
 * `module.resource` dotting like most other modules. Confirmed from the
 * 403 docs in every `bruno/CommandCenter/Dashboard/*.bru` file:
 * "المستخدم مالوش صلاحية `command_center`".
 */
export const COMMAND_CENTER_RESOURCE = "command_center" as const
