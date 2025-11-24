// components/panama-beneficial-owner-form.tsx
"use client";

import { useState, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useDebouncedEffect } from "@/hooks/useDebouncedEffect";

const SummaryRow = ({ label, value }: { label: string; value: any }) => (
  <div className="flex justify-between text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium text-right ml-4">
      {value !== "" && value !== undefined && value !== null ? value : "—"}
    </span>
  </div>
);

const BO_STEPS = [
  { id: "personal", title: "Personal Details" },
  { id: "financial", title: "Financial Profile" },
  { id: "pep", title: "PEP Questions" },
  { id: "review", title: "Review & Signature" },
] as const;

type SourceOfFunds = {
  salary: boolean;
  businessIncome: boolean;
  savings: boolean;
  investmentIncome: boolean;
  realEstateIncome: boolean;
  cryptoTrading: boolean;
  saleOfAssets: boolean;
  inheritance: boolean;
  dividends: boolean;
  professionalFees: boolean;
  loanProceeds: boolean;
  trustDistribution: boolean;
  ipoProceeds: boolean;
  vcReturns: boolean;
  cryptoMining: boolean;
  insurancePayouts: boolean;
  others: boolean;
  othersDetail: string;
};

type BeneficialOwner = {
  // Personal
  fullName: string;
  nationality: string;
  email: string;
  passportNumber: string;
  dateOfBirth: string;
  address: string;

  // Financial
  yearlyIncome: string;
  netWorth: string;
  sourceOfFunds: SourceOfFunds;
  sourceOfWealth: string;

  // PEP
  isPEP: string; // "yes" | "no" | ""
  pepDetails: string;

  // Signature
  signatureType: string; // "drawn" | "uploaded" | ""
  signatureDataUrl: string;
  signatureFileName: string;
  signedAt: string;
};

type PanamaBeneficialOwnerFormProps = {
  onboardingId: string;
  jurisdiction: string;
  requiresNomineeDirector: boolean; // kept for props shape, not used in this file
};

const initialSourceOfFunds: SourceOfFunds = {
  salary: false,
  businessIncome: false,
  savings: false,
  investmentIncome: false,
  realEstateIncome: false,
  cryptoTrading: false,
  saleOfAssets: false,
  inheritance: false,
  dividends: false,
  professionalFees: false,
  loanProceeds: false,
  trustDistribution: false,
  ipoProceeds: false,
  vcReturns: false,
  cryptoMining: false,
  insurancePayouts: false,
  others: false,
  othersDetail: "",
};

export default function PanamaBeneficialOwnerForm({
  onboardingId,
  jurisdiction,
}: PanamaBeneficialOwnerFormProps) {
  const router = useRouter();

  const [stepError, setStepError] = useState("");
  const [currentStep, setCurrentStep] = useState(0);

  // Signature
  const [signatureMethod, setSignatureMethod] = useState<
    "draw" | "upload" | null
  >(null);
  const [signaturePreview, setSignaturePreview] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isFirst = currentStep === 0;
  const isLast = currentStep === BO_STEPS.length - 1;
  const progress = ((currentStep + 1) / BO_STEPS.length) * 100;

  // -------------------------------
  // FORM STATE (single BO)
  // -------------------------------
  const [bo, setBO] = useState<BeneficialOwner>({
    fullName: "",
    nationality: "",
    email: "",
    passportNumber: "",
    dateOfBirth: "",
    address: "",
    yearlyIncome: "",
    netWorth: "",
    sourceOfFunds: { ...initialSourceOfFunds },
    sourceOfWealth: "",
    isPEP: "",
    pepDetails: "",
    signatureType: "",
    signatureDataUrl: "",
    signatureFileName: "",
    signedAt: "",
  });

  // -------------------------
  // Generic change handler
  // -------------------------
  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setBO((prev) => ({ ...prev, [name]: value }));
  };

  // -----------------------
  // SIGNATURE HANDLING
  // -----------------------
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL();
    setSignaturePreview(dataUrl);
    setIsDrawing(false);
  };

  const saveDrawnSignature = () => {
    if (!signaturePreview) return;
    setBO((prev) => ({
      ...prev,
      signatureDataUrl: signaturePreview,
      signatureType: "drawn",
      signedAt: prev.signedAt || new Date().toISOString(),
    }));
    setSignatureMethod(null);
  };

  const uploadSignature = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File must be <5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setSignaturePreview(url);
      setBO((prev) => ({
        ...prev,
        signatureDataUrl: url,
        signatureType: "uploaded",
        signatureFileName: file.name,
        signedAt: prev.signedAt || new Date().toISOString(),
      }));
    };

    reader.readAsDataURL(file);
    setSignatureMethod(null);
  };

  const resetSignature = () => {
    setSignaturePreview("");
    setBO((prev) => ({
      ...prev,
      signatureType: "",
      signatureDataUrl: "",
      signatureFileName: "",
      signedAt: "",
    }));
    setSignatureMethod(null);
  };

  // -----------------------------------
  // VALIDATION PER STEP
  // -----------------------------------
  const validateStep = () => {
    setStepError("");

    const stepId = BO_STEPS[currentStep].id;

    // STEP 1: Personal
    if (stepId === "personal") {
      if (!bo.fullName.trim()) return false;
      if (!bo.nationality.trim()) return false;
      if (!bo.email.trim()) return false;
      if (!bo.passportNumber.trim()) return false;
      if (!bo.dateOfBirth.trim()) return false;
      if (!bo.address.trim()) return false;
    }

    // STEP 2: Financial
    if (stepId === "financial") {
      if (!bo.yearlyIncome.trim()) return false;
      if (!bo.netWorth.trim()) return false;
      if (!bo.sourceOfWealth.trim()) return false;

      const { othersDetail, ...flags } = bo.sourceOfFunds;
      const hasAnySource = Object.values(flags).some(Boolean);
      if (!hasAnySource) return false;

      if (bo.sourceOfFunds.others && !othersDetail.trim()) return false;
    }

    // STEP 3: PEP
    if (stepId === "pep") {
      if (!bo.isPEP) return false;
      if (bo.isPEP === "yes" && !bo.pepDetails.trim()) return false;
    }

    // STEP 4: Review & Signature
    if (stepId === "review") {
      if (!bo.signatureType) return false;
      if (!bo.signatureDataUrl) return false;
      return true;
    }

    return true;
  };

  const goNext = () => {
    if (!validateStep()) {
      setStepError("Please complete all required fields.");
      return;
    }

    if (!isLast) {
      setCurrentStep((s) => s + 1);
      return;
    }

    // last step -> submit
    handleFinalSubmit();
  };

  const goBack = () => {
    if (!isFirst) setCurrentStep((s) => s - 1);
  };

  // -----------------------------------
  // FINAL SUBMIT → Pricing
  // -----------------------------------
  const handleFinalSubmit = async () => {
    try {
      setStepError("");

      // 1️⃣ SAVE BENEFICIAL OWNER DATA
      const saveRes = await fetch(
        "/api/company-incorporation/panama/beneficial-owner",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            onboardingId,
            jurisdiction,
            data: bo,
          }),
        }
      );

      if (!saveRes.ok) {
        setStepError("Failed to submit. Please try again.");
        return;
      }

      // 2️⃣ CREATE / FETCH PENDING ORDER
      const orderRes = await fetch("/api/incorporation/start-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onboardingId,
          jurisdiction,
          companyNames: {
            firstPreference: bo.fullName || "Panama Company",
          },
        }),
      });

      const json = await orderRes.json();

      if (!orderRes.ok) {
        console.error("[order error]", json);
        setStepError(json.error || "Order creation failed.");
        return;
      }

      // 3️⃣ REDIRECT TO THE SERVER-GENERATED URL
      router.push(json.pricingUrl);
    } catch (err) {
      console.error(err);
      setStepError("Unexpected error occurred.");
    }
  };

  // -----------------------------------
  // Autosave (debounced)
  // -----------------------------------
  useDebouncedEffect(
    () => {
      if (!onboardingId) return;

      fetch("/api/company-incorporation/panama/beneficial-owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onboardingId,
          formType: "panama-beneficial-owner",
          data: bo,
        }),
      });
    },
    [bo],
    800
  );

  // Helper to render Source of Funds summary
  const sourceOfFundsSummary = () => {
    const labels: { key: keyof SourceOfFunds; label: string }[] = [
      { key: "salary", label: "Salary / Employment Income" },
      { key: "businessIncome", label: "Business Income / Company Profits" },
      { key: "savings", label: "Savings Accumulated Over Time" },
      { key: "investmentIncome", label: "Investment Income" },
      { key: "realEstateIncome", label: "Real Estate Income" },
      { key: "cryptoTrading", label: "Crypto Trading & Investment Gains" },
      { key: "saleOfAssets", label: "Sale of Assets" },
      { key: "inheritance", label: "Inheritance / Family Gifts" },
      { key: "dividends", label: "Dividends / Shareholding Income" },
      {
        key: "professionalFees",
        label: "Professional Fees (Legal, Consulting, Medical)",
      },
      { key: "loanProceeds", label: "Loan Proceeds" },
      { key: "trustDistribution", label: "Trust Distribution" },
      { key: "ipoProceeds", label: "IPO / Private Placement Proceeds" },
      { key: "vcReturns", label: "Venture Capital / Angel Investment Returns" },
      { key: "cryptoMining", label: "Crypto Mining Income" },
      {
        key: "insurancePayouts",
        label: "Insurance / Compensation Payouts",
      },
    ];

    const active: string[] = [];
    labels.forEach(({ key, label }) => {
      if (bo.sourceOfFunds[key]) active.push(label);
    });

    if (bo.sourceOfFunds.others && bo.sourceOfFunds.othersDetail.trim()) {
      active.push(`Others: ${bo.sourceOfFunds.othersDetail.trim()}`);
    }

    if (active.length === 0) return "—";
    return active.join(", ");
  };

  function netWorthDisplay() {
    const map = {
      "<100k": "Less than $100,000",
      "100-200k": "$100,000 – $200,000",
      "200-500k": "$200,000 – $500,000",
      ">500k": "More than $500,000",
    };
    return map[bo.netWorth] || bo.netWorth;
  }

  // -------------------------------
  // UI OUTPUT
  // -------------------------------
  return (
    <div className="max-w-4xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Panama Beneficial Owner Form</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Progress */}
          <div className="space-y-2 mb-6">
            <Progress value={progress} className="w-full" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                Step {currentStep + 1} of {BO_STEPS.length}
              </span>
              <span>{BO_STEPS[currentStep].title}</span>
            </div>
          </div>

          {/* Step Chips */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
            {BO_STEPS.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className={`px-3 py-1 rounded-full text-sm border ${
                  i === currentStep
                    ? "bg-blue-600 text-white border-blue-600"
                    : i < currentStep
                    ? "bg-green-100 text-green-800 border-green-300"
                    : "bg-gray-100 text-gray-600 border-gray-300"
                }`}
                onClick={() => setCurrentStep(i)}
              >
                {s.title}
              </button>
            ))}
          </div>

          {/* ERROR */}
          {stepError && (
            <div className="bg-red-100 text-red-700 border border-red-300 px-4 py-3 rounded-md mb-4 text-sm">
              {stepError}
            </div>
          )}

          {/* STEP CONTENT */}
          <div className="border rounded-md p-4 space-y-6 mb-6">
            {/* STEP 1: PERSONAL */}
            {BO_STEPS[currentStep].id === "personal" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">
                  1. Personal Information
                </h3>

                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input
                    name="fullName"
                    value={bo.fullName}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Nationality *</Label>
                  <Input
                    name="nationality"
                    value={bo.nationality}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    name="email"
                    value={bo.email}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Passport Number *</Label>
                  <Input
                    name="passportNumber"
                    value={bo.passportNumber}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Date of Birth *</Label>
                  <Input
                    type="date"
                    name="dateOfBirth"
                    value={bo.dateOfBirth}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Residential Address *</Label>
                  <textarea
                    name="address"
                    value={bo.address}
                    onChange={handleChange}
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
            )}

            {/* STEP 2: FINANCIAL */}
            {BO_STEPS[currentStep].id === "financial" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">2. Financial Profile</h3>

                {/* Yearly Income */}
                <div className="space-y-1">
                  <Label>Yearly Income *</Label>
                  <select
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    value={bo.yearlyIncome}
                    onChange={(e) =>
                      setBO((prev) => ({
                        ...prev,
                        yearlyIncome: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select</option>
                    <option value="<100k">Less than 100,000</option>
                    <option value="100-200k">100,000 - 200,000</option>
                    <option value="200-500k">200,000 - 500,000</option>
                    <option value=">500k">More than 500,000</option>
                  </select>
                </div>

                {/* Source of Funds */}
                <div className="space-y-3 mt-4">
                  <Label className="font-medium">Source of Funds *</Label>

                  <div className="grid grid-cols-1 gap-2 text-sm">
                    {[
                      ["salary", "Salary / Employment Income"],
                      ["businessIncome", "Business Income / Company Profits"],
                      ["savings", "Savings Accumulated Over Time"],
                      ["investmentIncome", "Investment Income"],
                      ["realEstateIncome", "Real Estate Income"],
                      ["cryptoTrading", "Crypto Trading & Investment Gains"],
                      ["saleOfAssets", "Sale of Assets"],
                      ["inheritance", "Inheritance / Family Gifts"],
                      ["dividends", "Dividends / Shareholding Income"],
                      [
                        "professionalFees",
                        "Professional Fees (Legal, Consulting, Medical)",
                      ],
                      ["loanProceeds", "Loan Proceeds"],
                      ["trustDistribution", "Trust Distribution"],
                      ["ipoProceeds", "IPO / Private Placement Proceeds"],
                      [
                        "vcReturns",
                        "Venture Capital / Angel Investment Returns",
                      ],
                      ["cryptoMining", "Crypto Mining Income"],
                      ["insurancePayouts", "Insurance / Compensation Payouts"],
                    ].map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={
                            bo.sourceOfFunds[
                              key as keyof SourceOfFunds
                            ] as boolean
                          }
                          onChange={(e) =>
                            setBO((prev) => ({
                              ...prev,
                              sourceOfFunds: {
                                ...prev.sourceOfFunds,
                                [key]: e.target.checked,
                              },
                            }))
                          }
                        />
                        {label}
                      </label>
                    ))}

                    {/* Others */}
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={bo.sourceOfFunds.others}
                        onChange={(e) =>
                          setBO((prev) => ({
                            ...prev,
                            sourceOfFunds: {
                              ...prev.sourceOfFunds,
                              others: e.target.checked,
                              othersDetail: e.target.checked
                                ? prev.sourceOfFunds.othersDetail
                                : "",
                            },
                          }))
                        }
                      />
                      Others
                    </label>

                    {bo.sourceOfFunds.others && (
                      <Textarea
                        className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                        placeholder="Please specify"
                        value={bo.sourceOfFunds.othersDetail}
                        onChange={(e) =>
                          setBO((prev) => ({
                            ...prev,
                            sourceOfFunds: {
                              ...prev.sourceOfFunds,
                              othersDetail: e.target.value,
                            },
                          }))
                        }
                      />
                    )}
                  </div>
                </div>

                {/* Source of Wealth */}
                <div className="space-y-2">
                  <Label>Source of Wealth *</Label>
                  <textarea
                    name="sourceOfWealth"
                    value={bo.sourceOfWealth}
                    onChange={handleChange}
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                {/* Net Worth */}
                <div className="space-y-1">
                  <Label>Estimated Net Worth *</Label>
                  <select
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    value={bo.netWorth}
                    onChange={(e) =>
                      setBO((prev) => ({
                        ...prev,
                        netWorth: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select</option>
                    <option value="<100k">Less than 100,000</option>
                    <option value="100-200k">100,000 - 200,000</option>
                    <option value="200-500k">200,000 - 500,000</option>
                    <option value=">500k">More than 500,000</option>
                  </select>
                </div>
              </div>
            )}

            {/* STEP 3: PEP */}
            {BO_STEPS[currentStep].id === "pep" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">3. PEP Questionnaire</h3>

                <div className="space-y-2">
                  <Label>Are you a Politically Exposed Person (PEP)? *</Label>

                  <div className="flex gap-6">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="isPEP"
                        value="yes"
                        checked={bo.isPEP === "yes"}
                        onChange={handleChange}
                      />
                      Yes
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="isPEP"
                        value="no"
                        checked={bo.isPEP === "no"}
                        onChange={handleChange}
                      />
                      No
                    </label>
                  </div>
                </div>

                {bo.isPEP === "yes" && (
                  <div className="space-y-2">
                    <Label>Provide complete details *</Label>
                    <textarea
                      name="pepDetails"
                      rows={6}
                      value={bo.pepDetails}
                      onChange={handleChange}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                )}
              </div>
            )}

            {/* STEP 4: REVIEW */}
            {BO_STEPS[currentStep].id === "review" && (
              <div className="space-y-8">
                <h3 className="text-lg font-semibold">Review & Signature</h3>

                {/* SUMMARY */}
                <div className="space-y-6">
                  {/* Personal */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-medium">Personal Details</h4>
                      <SummaryRow label="Full Name" value={bo.fullName} />
                      <SummaryRow label="Nationality" value={bo.nationality} />
                      <SummaryRow label="Email" value={bo.email} />
                      <SummaryRow
                        label="Date of Birth"
                        value={bo.dateOfBirth}
                      />
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">Identity Details</h4>
                      <SummaryRow
                        label="Passport Number"
                        value={bo.passportNumber}
                      />
                      <SummaryRow
                        label="Residential Address"
                        value={bo.address}
                      />
                    </div>
                  </div>

                  {/* Financial */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Financial Profile</h4>
                    <SummaryRow label="Yearly Income" value={bo.yearlyIncome} />
                    <SummaryRow
                      label="Source of Funds"
                      value={sourceOfFundsSummary()}
                    />
                    <SummaryRow
                      label="Source of Wealth"
                      value={bo.sourceOfWealth}
                    />
                    <SummaryRow
                      label="Estimated Net Worth"
                      value={netWorthDisplay()}
                    />
                  </div>

                  {/* PEP */}
                  <div className="space-y-3">
                    <h4 className="font-medium">PEP Questionnaire</h4>
                    <SummaryRow
                      label="PEP Status"
                      value={bo.isPEP === "yes" ? "Yes" : "No"}
                    />
                    {bo.isPEP === "yes" && (
                      <SummaryRow label="PEP Details" value={bo.pepDetails} />
                    )}
                  </div>
                </div>

                {/* SIGNATURE */}
                <div className="space-y-6 border rounded-lg p-6 mt-4">
                  <h4 className="text-lg font-semibold">Signature</h4>

                  {/* Select signature method */}
                  {!bo.signatureType && signatureMethod === null && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setSignatureMethod("draw")}
                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
                      >
                        <span className="font-medium">Draw Signature</span>
                        <p className="text-sm text-muted-foreground">
                          Use your mouse or trackpad
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSignatureMethod("upload")}
                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
                      >
                        <span className="font-medium">Upload Signature</span>
                        <p className="text-sm text-muted-foreground">
                          Upload an image of your signature
                        </p>
                      </button>
                    </div>
                  )}

                  {/* Draw signature */}
                  {signatureMethod === "draw" && !bo.signatureType && (
                    <div className="border rounded-lg p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <Label>Draw your signature below</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={resetSignature}
                        >
                          Clear
                        </Button>
                      </div>

                      <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white">
                        <canvas
                          ref={canvasRef}
                          width={600}
                          height={200}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          className="cursor-crosshair bg-white border border-gray-300 rounded-md block"
                          style={{
                            width: 600,
                            height: 200,
                            touchAction: "none",
                          }}
                        />
                      </div>

                      <div className="flex gap-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setSignatureMethod(null)}
                        >
                          Back
                        </Button>
                        <Button
                          type="button"
                          onClick={saveDrawnSignature}
                          disabled={!signaturePreview}
                        >
                          Save Signature
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Upload signature */}
                  {signatureMethod === "upload" && !bo.signatureType && (
                    <div className="border rounded-lg p-4 space-y-4">
                      <Label>Upload your signature file</Label>

                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <input
                          id="boSignatureUpload"
                          type="file"
                          accept=".jpg,.jpeg,.png,.gif,.pdf"
                          onChange={uploadSignature}
                          className="hidden"
                        />
                        <label
                          htmlFor="boSignatureUpload"
                          className="cursor-pointer block"
                        >
                          <p className="text-sm text-blue-600 font-medium">
                            Click to upload
                          </p>
                          <p className="text-xs text-gray-500">
                            PNG, JPG, GIF, PDF up to 5MB
                          </p>
                        </label>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setSignatureMethod(null)}
                      >
                        Back
                      </Button>
                    </div>
                  )}

                  {/* Signature Preview */}
                  {bo.signatureType && (
                    <div className="border rounded-lg p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <Label>
                          {bo.signatureType === "drawn"
                            ? "Drawn Signature"
                            : "Uploaded Signature"}
                        </Label>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={resetSignature}
                        >
                          Change Signature
                        </Button>
                      </div>

                      {bo.signatureDataUrl && (
                        <div className="bg-white border rounded-lg p-4 flex justify-center">
                          <img
                            src={bo.signatureDataUrl}
                            alt="Signature preview"
                            className="max-w-full max-h-32"
                          />
                        </div>
                      )}

                      <p className="text-xs text-green-600">
                        ✓ Signature saved successfully
                      </p>
                    </div>
                  )}

                  {/* Verification info */}
                  {bo.signatureType && (
                    <div className="bg-green-50 p-3 rounded-lg text-xs space-y-1 text-green-700">
                      <p>✓ Signature Type: {bo.signatureType}</p>
                      <p>
                        Signed At:{" "}
                        {bo.signedAt
                          ? new Date(bo.signedAt).toLocaleString()
                          : "—"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* NAVIGATION */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" disabled={isFirst} onClick={goBack}>
              Back
            </Button>

            {!isLast ? (
              <Button onClick={goNext}>Next</Button>
            ) : (
              <Button onClick={handleFinalSubmit}>Continue to Payment</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
