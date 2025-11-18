import SingaporeCompanyIncorporationForm from "@/components/singapore-company-incorporation-form";

export default function SingaporePage({ searchParams }) {
  const onboardingId = searchParams.onboardingId;
  const jurisdiction = searchParams.jurisdiction || "singapore";

  if (!onboardingId) {
    return <div className="p-8">Missing onboarding ID</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-10">
      <SingaporeCompanyIncorporationForm
        onboardingId={onboardingId}
        jurisdiction={jurisdiction}
      />
    </div>
  );
}
