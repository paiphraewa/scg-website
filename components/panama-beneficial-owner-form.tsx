"use client";

import { useState, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter, useSearchParams } from "next/navigation";
import { countries } from "@/lib/countries";
import { useDebouncedEffect } from "@/hooks/useDebouncedEffect";

const SummaryRow = ({ label, value }: { label: string; value: any }) => (
  <div className="flex justify-between text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium text-right ml-4">
      {value !== "" ? value : "—"}
    </span>
  </div>
);

const BO_STEPS = [
  { id: "personal", title: "Personal Details" },
  { id: "financial", title: "Financial Profile" },
  { id: "pep", title: "PEP Questions" },
  { id: "review", title: "Review & Signature" },
] as const;

type PanamaBeneficialOwnerFormProps = {
  onboardingId: string;
  jurisdiction: string;
  requiresNomineeDirector: boolean;
};

export default function PanamaBeneficialOwnerForm({
  onboardingId,
  jurisdiction,
  requiresNomineeDirector,
}: PanamaBeneficialOwnerFormProps) {
  const router = useRouter();

  const [stepError, setStepError] = useState("");
  const [currentStep, setCurrentStep] = useState(0);

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
  // FORM STATE
  // -------------------------------
  const [bo, setBO] = useState({
    // PERSONAL
    fullName: "",
    nationality: "",
    email: "",
    passportNumber: "",
    dateOfBirth: "",
    address: "",

    // FINANCIAL
    yearlyIncome: "",
    sourceOfFunds: "",
    sourceOfWealth: "",
    netWorth: "",

    // PEP
    isPEP: "",
    pepDetails: "",

    // SIGNATURE
    signatureType: "",
    signatureDataUrl: "",
    signatureFileName: "",
    signatureFile: null,
    signedAt: "",
  });

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setBO((prev) => ({ ...prev, [name]: value }));
  };

  // -----------------------
  // SIGNATURE HANDLING
  // -----------------------
  const startDrawing = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: any) => {
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
    setBO((prev) => ({
      ...prev,
      signatureDataUrl: signaturePreview,
      signatureType: "drawn",
      signedAt: new Date().toISOString(),
    }));
    setSignatureMethod(null);
  };

  const uploadSignature = (e: any) => {
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
        signedAt: new Date().toISOString(),
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
      signedAt: "",
    }));
    setSignatureMethod(null);
  };

  // -----------------------------------
  // VALIDATION PER STEP
  // -----------------------------------
  const validateStep = () => {
    setStepError("");

    if (BO_STEPS[currentStep].id === "personal") {
      if (!bo.fullName.trim()) return false;
      if (!bo.nationality.trim()) return false;
      if (!bo.email.trim()) return false;
      if (!bo.passportNumber.trim()) return false;
      if (!bo.dateOfBirth.trim()) return false;
      if (!bo.address.trim()) return false;
    }

    if (BO_STEPS[currentStep].id === "financial") {
      if (!bo.yearlyIncome.trim()) return false;
      if (!bo.sourceOfFunds.trim()) return false;
      if (!bo.sourceOfWealth.trim()) return false;
      if (!bo.netWorth.trim()) return false;
    }

    if (BO_STEPS[currentStep].id === "pep") {
      if (!bo.isPEP) return false;
      if (bo.isPEP === "yes" && !bo.pepDetails.trim()) return false;
    }

    if (BO_STEPS[currentStep].id === "review") {
      if (!bo.signatureType) return false;
      if (!bo.signatureDataUrl) return false;
      return true; // <-- REQUIRED
    }

    return true;
  };

  const goNext = () => {
    if (!validateStep()) {
      setStepError("Please complete all required fields.");
      return;
    }

    // If not last → just continue
    if (!isLast) {
      setCurrentStep((s) => s + 1);
      return;
    }

    // If last step (review) → submit
    handleFinalSubmit();
  };

  const goBack = () => {
    if (!isFirst) setCurrentStep((s) => s - 1);
  };

  // -----------------------------------
  // FINAL SUBMIT → Form 3
  // -----------------------------------
  const handleFinalSubmit = async () => {
    try {
      const payload = {
        onboardingId,
        formType: "panama-beneficial-owner",
        data: bo,
      };

      const res = await fetch(
        "/api/company-incorporation/panama/beneficial-owner",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        setStepError("Failed to submit. Try again.");
        return;
      }

      // ⭐ CONDITIONAL FLOW:
      if (requiresNomineeDirector) {
        // Nominee director used → skip Form 3 → Pricing
        router.push(
          `/pricing?onboardingId=${onboardingId}&jurisdiction=${jurisdiction}`
        );
      } else {
        // No nominee → must fill Director Form 3
        router.push(
          `/company-incorporation/panama/board-of-directors?onboardingId=${onboardingId}&jurisdiction=${jurisdiction}`
        );
      }
    } catch (err) {
      console.error(err);
      setStepError("Unexpected error occurred.");
    }
  };

  useDebouncedEffect(
    () => {
      // Skip autosave when running locally
      if (process.env.NODE_ENV !== "production") return;
      if (!onboardingId) return;

      fetch("/api/company-incorporation/panama/beneficial-owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onboardingId,
          formType: "panama-beneficial-owner",
          data: bo, // <— full beneficial owner data
        }),
      });
    },
    [bo],
    800
  );

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
            {/* ---------------- STEP 1: PERSONAL INFO ---------------- */}
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
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
            )}

            {/* ---------------- STEP 2: FINANCIAL ---------------- */}
            {BO_STEPS[currentStep].id === "financial" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">2. Financial Profile</h3>

                <div className="space-y-2">
                  <Label>Yearly Income *</Label>
                  <Input
                    name="yearlyIncome"
                    value={bo.yearlyIncome}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Source of Funds *</Label>
                  <textarea
                    name="sourceOfFunds"
                    value={bo.sourceOfFunds}
                    onChange={handleChange}
                    rows={3}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Source of Wealth *</Label>
                  <textarea
                    name="sourceOfWealth"
                    value={bo.sourceOfWealth}
                    onChange={handleChange}
                    rows={3}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Estimated Net Worth *</Label>
                  <Input
                    name="netWorth"
                    value={bo.netWorth}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
            )}

            {/* ---------------- STEP 3: PEP ---------------- */}
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
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                )}
              </div>
            )}

            {/* ---------------- STEP 4: REVIEW ---------------- */}
            {BO_STEPS[currentStep].id === "review" && (
              <div className="space-y-8">
                <h3 className="text-lg font-semibold">Review & Signature</h3>

                {/* SUMMARY – BVI-style grid */}
                <div className="space-y-6">
                  {/* Row 1: Personal */}
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

                  {/* Row 2: Financial */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Financial Profile</h4>
                    <SummaryRow label="Yearly Income" value={bo.yearlyIncome} />
                    <SummaryRow
                      label="Source of Funds"
                      value={bo.sourceOfFunds}
                    />
                    <SummaryRow
                      label="Source of Wealth"
                      value={bo.sourceOfWealth}
                    />
                    <SummaryRow
                      label="Estimated Net Worth"
                      value={bo.netWorth}
                    />
                  </div>

                  {/* Row 3: PEP */}
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

                {/* SIGNATURE – identical layout to Form 1 */}
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
                          Use your mouse or trackpad to draw your signature
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

                  {/* DRAW SIGNATURE */}
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

                  {/* UPLOAD SIGNATURE */}
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
              <Button onClick={handleFinalSubmit}>
                Submit Beneficial Owner Form
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
