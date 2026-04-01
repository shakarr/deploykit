import { ROLE_OPTIONS } from "@/features/users/infrastructure/ui/constants/roles.constants";

type RoleValueT = (typeof ROLE_OPTIONS)[number]["value"];

export type { RoleValueT };
