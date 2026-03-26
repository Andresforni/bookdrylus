// src/app/api/auth/nextauth/route.ts
// Archivo legacy — redirige al handler correcto en [...nextauth]
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
