"use client";

import { useState } from "react";

import { getAuthUser } from "@/lib/auth/storage";
import type { User } from "@/types/entities";

export const useAuthUser = () => {
  const [user] = useState<User | null>(() => getAuthUser());

  return user;
};
