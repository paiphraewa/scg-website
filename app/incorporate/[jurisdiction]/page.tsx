// app/incorporate/[jurisdiction]/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ClientRegisterForm } from "@/components/client-register-form";
import { ensureBviOnboardingAndDraft } from "@/lib/flow";

interface IncorporationPageProps {
  params: { jurisdiction: string };
}

export default async function IncorporationPage({
  params,
}: IncorporationPageProps) {
  const session = await auth();
  const j = params.jurisdiction.toLowerCase();

  if (!session) {
    redirect(`/login?callbackUrl=/incorporate/${j}`);
  }

  // ✅ BVI → existing flow
  if (j === "bvi") {
    const { onboardingId } = await ensureBviOnboardingAndDraft();
    redirect(
      `/company-incorporation?onboardingId=${onboardingId}&jurisdiction=BVI`
    );
  }

  // ✅ PANAMA → call start API, then go to Form 1
  if (j === "panama") {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";

    const res = await fetch(
      `${baseUrl}/api/incorporation/start?jurisdiction=panama`,
      {
        method: "POST",
        cache: "no-store",
      }
    );

    const data = await res.json();

    if (data?.onboardingId) {
      redirect(
        `/company-incorporation/panama/form1?onboardingId=${data.onboardingId}&jurisdiction=panama`
      );
    }

    redirect("/error");
  }

  // ✅ Old flow for others
  const jurisdictionName = getJurisdictionName(j);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Client Onboarding – {jurisdictionName}
        </h1>
        <p className="text-muted-foreground">
          Welcome back, {session.user?.email}! Complete client onboarding below.
        </p>
      </div>

      <ClientRegisterForm jurisdiction={j} />
    </div>
  );
}

function getJurisdictionName(j: string): string {
  const names: Record<string, string> = {
    bvi: "British Virgin Islands (BVI)",
    cayman: "Cayman Islands",
    hongkong: "Hong Kong",
    singapore: "Singapore",
    panama: "Panama",
  };
  return names[j] || j.toUpperCase();
}
