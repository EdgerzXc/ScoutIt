import PasswordRecoveryForm from "./PasswordRecoveryForm";

export const metadata = {
  title: "Reset your password",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function ResetPasswordPage({ searchParams }) {
  const params = await searchParams;
  return <PasswordRecoveryForm enterCode={params?.step === "code"} />;
}
