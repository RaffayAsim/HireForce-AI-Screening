"use client";

import React from "react";
import AuthFlow from "@/components/auth/AuthFlow";

export default function Login() {
  return <AuthFlow initialMode="signin" />;
}
