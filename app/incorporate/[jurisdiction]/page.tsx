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

  // ✅ CAYMAN → lookup or start → go to Cayman Form 1
  if (j === "cayman") {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";

    // Step 1 — check for draft
    try {
      const lookupRes = await fetch(
        `${baseUrl}/api/incorporation/lookup?jurisdiction=cayman`,
        { cache: "no-store" }
      );

      if (lookupRes.ok) {
        const info = await lookupRes.json();

        if (info.found && info.onboardingId) {
          redirect(
            `/company-incorporation/cayman/entity-instruction?onboardingId=${info.onboardingId}&jurisdiction=cayman`
          );
        }
      }
    } catch (err) {
      console.error("Cayman lookup error:", err);
    }

    // Step 2 — no draft → start new row
    try {
      const startRes = await fetch(
        `${baseUrl}/api/incorporation/start?jurisdiction=cayman`,
        { method: "POST", cache: "no-store" }
      );

      const startData = await startRes.json();

      if (startData?.onboardingId) {
        redirect(
          `/company-incorporation/cayman/entity-instruction?onboardingId=${startData.onboardingId}&jurisdiction=cayman`
        );
      }
    } catch (err) {
      console.error("Cayman start error:", err);
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
