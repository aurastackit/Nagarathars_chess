import type { Metadata } from "next";
import { CommunityRegisterWizard } from "@/components/community-register-wizard";

export const metadata: Metadata = {
  title: "Register — Nagarathar's Chess Championship",
  description: "Register for the Nagarathar's Chess Championship in three quick steps.",
};

export default function RegisterPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[#12312d]">Championship registration</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-[#6b6555]">
          Verify your mobile number, confirm the OTP, then fill out your details. All submissions
          are reviewed by the admin before approval.
        </p>
      </div>
      <div className="mt-10">
        <CommunityRegisterWizard />
      </div>
    </main>
  );
}
