// app/company-incorporation/singapore/declaration/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SingaporeDeclarationForm } from "@/components/singapore-declaration-form";

type PageProps = {
  searchParams: {
    onboardingId?: string;
  };
};

export default async function SingaporeDeclarationPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/company-incorporation/singapore/declaration");
  }

  const onboardingId = searchParams.onboardingId;
  if (!onboardingId) {
    // If no onboardingId in query, just bounce them back to Singapore flow start
    redirect("/incorporate/singapore");
  }

  const incorporation = await prisma.companyIncorporation.findUnique({
    where: { onboardingId },
  });

  if (!incorporation) {
    // Nothing in DB – send them back to start
    redirect("/incorporate/singapore");
  }

  // Directors were stored as JSON in singaporeDirectors
  const directors = (incorporation.singaporeDirectors as any[]) || [];

  // Company name from singaporeCompanyDetails or falls back
  const sgDetails = (incorporation.singaporeCompanyDetails as any) || {};
  const companyName =
    sgDetails.intendedName ||
    sgDetails?.companyName ||
    "Singapore Company";

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-2">
        Singapore – Declaration & Signature
      </h1>
      <p className="text-muted-foreground mb-6">
        Please review the declaration below and sign as an authorised director.
      </p>

      <SingaporeDeclarationForm
        onboardingId={onboardingId}
        jurisdiction="SINGAPORE"
        companyName={companyName}
        directors={directors}
      />
    </div>
  );
}
