// components/panama-incorporation-form.tsx
"use client";

import { useState, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { countries } from "@/lib/countries";
import { useDebouncedEffect } from "@/hooks/useDebouncedEffect";

const SummaryRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex justify-between text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium text-right ml-4">
      {value && value !== "" ? value : "—"}
    </span>
  </div>
);

type PanamaIncorporationFormProps = {
  onboardingId: string;
  jurisdiction: string | null;
};

const PANAMA_STEPS = [
  { id: "activity", title: "Activity Information" },
  { id: "nominee-corporate", title: "Nominee Directors & Corporate Structure" },
  { id: "accounting", title: "Accounting Records" },
  { id: "review", title: "Review & Signature" },
] as const;

function SearchableCountrySelect({
  label,
  value,
  onChange,
  disabled = false,
  placeholder = "Select a country",
  showPhoneCode = false,
  hideLabel = false,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (
    newVal: string,
    meta?: { phoneCode?: string; phoneLength?: number }
  ) => void;
  disabled?: boolean;
  placeholder?: string;
  showPhoneCode?: boolean;
  hideLabel?: boolean;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filtered = countries.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.code.toLowerCase().includes(query.toLowerCase()) ||
      (c.phoneCode && c.phoneCode.toLowerCase().includes(query.toLowerCase()))
  );

  const selected = showPhoneCode
    ? countries.find((c) => c.phoneCode === value)
    : countries.find((c) => c.name === value);

  return (
    <div className={`space-y-2 relative ${className}`}>
      {/* label */}
      {!hideLabel && <Label>{label}</Label>}

      {/* trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen((o) => !o)}
        disabled={disabled}
        className="relative flex h-10 w-full items-center rounded-md border border-input bg-background
                   px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2
                   focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="flex-1 text-left truncate">
          {selected
            ? showPhoneCode
              ? `${selected.name} (${selected.phoneCode})`
              : selected.name
            : placeholder}
        </span>
      </button>

      {/* dropdown panel */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover text-popover-foreground shadow-md">
          {/* search bar */}
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full border-b border-border bg-popover px-2 py-1 text-sm text-foreground
                       placeholder:text-muted-foreground outline-none"
            placeholder="Search..."
          />

          {/* results */}
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                No matches
              </div>
            )}

            {filtered.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  if (showPhoneCode) {
                    onChange(c.phoneCode, {
                      phoneCode: c.phoneCode,
                      phoneLength: c.phoneLength,
                    });
                  } else {
                    onChange(c.name);
                  }
                  setIsOpen(false);
                  setQuery("");
                }}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm
                           hover:bg-accent hover:text-accent-foreground"
              >
                <span>{c.name}</span>

                {showPhoneCode && (
                  <span className="text-xs text-muted-foreground">
                    {c.phoneCode}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function PanamaIncorporationForm({
  onboardingId,
  jurisdiction,
}: PanamaIncorporationFormProps) {
  const [stepError, setStepError] = useState<string>("");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [signatureMethod, setSignatureMethod] = useState<
    "draw" | "upload" | null
  >(null);
  const [signaturePreview, setSignaturePreview] = useState<string>("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSignatureUploading, setIsSignatureUploading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const router = useRouter();
  const currentStep = PANAMA_STEPS[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === PANAMA_STEPS.length - 1;
  const progress = ((currentStepIndex + 1) / PANAMA_STEPS.length) * 100;
  const [legalEntity, setLegalEntity] = useState({
    // BASIC SECTION
    assetTypes: "",
    legalEntityName: "",
    entityAddress: "",
    activityDescription: "",
    activityCountry: "",

    // PHONE (split fields)
    phoneCountryCode: "",
    phoneNumber: "",
    expectedPhoneLength: 0,

    // EMAIL
    email: "",

    nomineeDirectorsService: "", // "yes" or "no"
    nomineeDirectorsJustification: "",

    // Step 2…
    corporateReasons: {
      privacyProtection: false,
      expediteIncorporation: false,
      estatePlanning: false,
      separationManagementOwnership: false,
      limitingPublicPresence: false,
      others: false,
      othersDetail: "",
    },

    // Step 3…
    accountingRecordsKeeperName: "",
    accountingRecordsKeeperPosition: "",
    accountingRecordsKeeperAddress: "",
    accountingRecordsKeeperEmail: "",
    accountingRecordsKeeperPhoneCountryCode: "",
    accountingRecordsKeeperPhoneNumber: "",
    accountingRecordsKeeperExpectedPhoneLength: 0,

    // Step 4…
    clientName: "",
    dateSigned: "",
    signatureDataUrl: "",
    signatureType: "",
    signedAt: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setLegalEntity((prev) => ({ ...prev, [name]: value }));
  };

  const handleReasonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setLegalEntity((prev) => ({
      ...prev,
      corporateReasons: {
        ...prev.corporateReasons,
        [name]: checked,
      },
    }));
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.closePath();
    setIsDrawing(false);

    const dataUrl = canvas.toDataURL();
    setSignaturePreview(dataUrl);
  };

  const clearSignature = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }

    setSignaturePreview("");
    setSignatureMethod(null);

    setLegalEntity((prev) => ({
      ...prev,
      signatureDataUrl: "",
      signatureType: "",
      signedAt: "",
    }));
  };

  // Just store in state for now (no upload)
  const saveDrawnSignature = () => {
    if (!signaturePreview) return;

    setLegalEntity((prev) => ({
      ...prev,
      signatureDataUrl: signaturePreview,
      signatureType: "drawn",
      signedAt: prev.signedAt || new Date().toISOString(),
    }));

    setSignatureMethod(null);
  };
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!validTypes.includes(file.type)) {
      alert("Please upload a valid image file (JPEG, PNG, GIF)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setSignaturePreview(result || "");
      setLegalEntity((prev) => ({
        ...prev,
        signatureDataUrl: result || "",
        signatureType: "uploaded",
        signedAt: prev.signedAt || new Date().toISOString(),
      }));
    };
    reader.readAsDataURL(file);

    setSignatureMethod(null);
  };

  const resetSignature = () => {
    clearSignature();
  };

  const validateStep1 = () => {
    if (!legalEntity.assetTypes.trim()) return false;
    if (!legalEntity.legalEntityName.trim()) return false;
    if (!legalEntity.entityAddress.trim()) return false;
    if (!legalEntity.activityDescription.trim()) return false;
    if (!legalEntity.activityCountry) return false;

    // PHONE rules
    if (!legalEntity.phoneCountryCode) return false;
    if (!legalEntity.phoneNumber) return false;
    if (
      legalEntity.expectedPhoneLength &&
      legalEntity.phoneNumber.length !== legalEntity.expectedPhoneLength
    )
      return false;

    if (!legalEntity.email.trim()) return false;

    return true;
  };

  const validateStep2 = () => {
    if (!legalEntity.nomineeDirectorsService) return false;

    if (
      legalEntity.nomineeDirectorsService === "yes" &&
      !legalEntity.nomineeDirectorsJustification.trim()
    )
      return false;

    const r = legalEntity.corporateReasons;

    const hasAnyReason =
      r.privacyProtection ||
      r.expediteIncorporation ||
      r.estatePlanning ||
      r.separationManagementOwnership ||
      r.limitingPublicPresence ||
      r.others;

    if (!hasAnyReason) return false;

    if (r.others && !r.othersDetail.trim()) return false;

    // nominee validation already handled in step1, no need to repeat
    return true;
  };

  const validateStep3 = () => {
    if (!legalEntity.accountingRecordsKeeperName.trim()) return false;
    if (!legalEntity.accountingRecordsKeeperPosition.trim()) return false;
    if (!legalEntity.accountingRecordsKeeperAddress.trim()) return false;
    if (!legalEntity.accountingRecordsKeeperEmail.trim()) return false;
    if (!legalEntity.accountingRecordsKeeperPhoneCountryCode) return false;
    if (!legalEntity.accountingRecordsKeeperPhoneNumber) return false;

    const expected = legalEntity.accountingRecordsKeeperExpectedPhoneLength;
    if (
      expected &&
      legalEntity.accountingRecordsKeeperPhoneNumber.length !== expected
    )
      return false;

    return true;
  };

  const validateStep4 = () => {
    if (!legalEntity.clientName.trim()) return false;
    if (!legalEntity.signatureType) return false;
    if (!legalEntity.signatureDataUrl) return false;
    return true;
  };

  const handleFinalSubmit = async () => {
    try {
      setStepError("");

      const payload = {
        onboardingId,
        jurisdiction,
        formType: "panama-legal-entity",
        data: legalEntity,
      };

      const res = await fetch(
        "/api/company-incorporation/panama/legal-entity",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const txt = await res.text();
        console.error("Submit failed:", txt);
        setStepError("Failed to submit. Please try again.");
        return;
      }

      // 🔑 Decide whether we need Board of Directors form
      const needsBoard =
        legalEntity.nomineeDirectorsService === "no" ? "yes" : "no";

      // 👉 Send this flag to Form 2 via query string
      const query = new URLSearchParams({
        onboardingId,
        jurisdiction: jurisdiction || "panama",
        needsBoard, // "yes" if we still need board form, "no" if we will skip it
      }).toString();

      router.push(`/company-incorporation/panama/beneficial-owner?${query}`);
    } catch (err) {
      console.error(err);
      setStepError("Unexpected error occurred.");
    }
  };

  async function goNext() {
    setStepError(""); // clear previous

    if (currentStep.id === "activity") {
      if (!validateStep1()) {
        setStepError("Please complete all required fields before continuing.");
        return;
      }
    }

    if (currentStep.id === "nominee-corporate") {
      if (!validateStep2()) {
        setStepError("Please complete all required fields before continuing.");
        return;
      }
    }

    if (currentStep.id === "accounting") {
      if (!validateStep3()) {
        setStepError("Please complete all required fields before continuing.");
        return;
      }
    }

    if (currentStep.id === "review") {
      if (!validateStep4()) {
        setStepError("Please complete all required fields (signature & name).");
        return;
      }

      // FINAL SUBMIT
      await handleFinalSubmit();
      return;
    }

    // otherwise go next
    setCurrentStepIndex((prev) => prev + 1);
  }

  function goBack() {
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }

  useDebouncedEffect(
    () => {
      if (!onboardingId) return;

      fetch("/api/company-incorporation/panama/legal-entity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onboardingId,
          formType: "panama-legal-entity",
          data: legalEntity,
        }),
      });
    },
    [legalEntity],
    800
  );

  return (
    <div className="max-w-4xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Panama Company Incorporation</CardTitle>
        </CardHeader>
        <CardContent>
          {/* BVI-style Progress Block */}
          <div className="space-y-4 mb-6">
            {/* Progress bar */}
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />

              <div className="flex justify-between text-sm text-muted-foreground">
                <span>
                  Step {currentStepIndex + 1} of {PANAMA_STEPS.length}
                </span>
                <span>{currentStep.title}</span>
              </div>
            </div>

            {/* Step indicator chips */}
            <div className="flex overflow-x-auto gap-2 pb-1">
              {PANAMA_STEPS.map((step, index) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setCurrentStepIndex(index)}
                  className={`flex-shrink-0 px-3 py-1 text-sm rounded-full border transition-colors
          ${
            index === currentStepIndex
              ? "bg-blue-600 text-white border-blue-600"
              : index < currentStepIndex
              ? "bg-green-100 text-green-800 border-green-300"
              : "bg-gray-100 text-gray-600 border-gray-300"
          }
        `}
                >
                  {step.title}
                </button>
              ))}
            </div>
          </div>

          {/* Step content */}
          <div className="border rounded-md p-4 mb-6">
            {currentStep.id === "activity" && (
              <div className="space-y-8">
                {/* ERROR BOX */}
                {stepError && (
                  <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-md text-sm">
                    {stepError}
                  </div>
                )}

                <h3 className="text-lg font-semibold">
                  1. Legal Entity Information
                </h3>

                {/* Asset Types */}
                <div className="space-y-2">
                  <Label>Type(s) of Asset(s) *</Label>
                  <Input
                    name="assetTypes"
                    value={legalEntity.assetTypes}
                    onChange={handleChange}
                    placeholder="e.g. Real estate, investments"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                {/* Legal Entity Name */}
                <div className="space-y-2">
                  <Label>Name of the Legal Entity *</Label>
                  <Input
                    name="legalEntityName"
                    value={legalEntity.legalEntityName}
                    onChange={handleChange}
                    placeholder="e.g. ABC Holdings Corp."
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label>Address of the Entity *</Label>
                  <textarea
                    name="entityAddress"
                    value={legalEntity.entityAddress}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Street, Number, Building, Floor, Country"
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                {/* Activity Description */}
                <div className="space-y-2">
                  <Label>Main Business Activity *</Label>
                  <textarea
                    name="activityDescription"
                    value={legalEntity.activityDescription}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Describe the entity’s activity"
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                {/* Activity Country */}
                <div className="space-y-2">
                  <Label>Country of Activity *</Label>
                  <select
                    name="activityCountry"
                    value={legalEntity.activityCountry}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select a country</option>
                    {countries.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Phone Number (BVI-style) */}
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number *</Label>

                  <div className="flex gap-3">
                    <SearchableCountrySelect
                      label="Country Code"
                      hideLabel
                      className="w-32"
                      value={legalEntity.phoneCountryCode}
                      showPhoneCode
                      onChange={(newVal, meta) => {
                        setLegalEntity((prev) => ({
                          ...prev,
                          phoneCountryCode: newVal,
                          expectedPhoneLength: meta?.phoneLength || 0,
                        }));
                        setStepError("");
                      }}
                      placeholder="Code"
                    />

                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      value={legalEntity.phoneNumber}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "");
                        const expected = legalEntity.expectedPhoneLength || 0;

                        if (expected && digits.length > expected) {
                          setStepError(
                            `Phone number must be exactly ${expected} digits for this country.`
                          );
                          return;
                        }

                        setLegalEntity((prev) => ({
                          ...prev,
                          phoneNumber: digits,
                        }));

                        setStepError("");
                      }}
                      placeholder="Phone number"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Expected length: {legalEntity.expectedPhoneLength || "—"}{" "}
                    digits
                  </p>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    name="email"
                    value={legalEntity.email}
                    onChange={handleChange}
                    placeholder="contact@example.com"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
            )}

            {currentStep.id === "nominee-corporate" && (
              <div className="space-y-8">
                {/* ERROR BOX */}
                {stepError && (
                  <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-md text-sm">
                    {stepError}
                  </div>
                )}

                <h3 className="text-lg font-semibold">
                  2. Nominee Directors & Corporate Structure
                </h3>

                {/* NOMINEE DIRECTORS SERVICE */}
                <div className="space-y-2">
                  <Label>Do you require Nominee Directors Service? *</Label>

                  <div className="flex gap-6">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="nomineeDirectorsService"
                        value="yes"
                        checked={legalEntity.nomineeDirectorsService === "yes"}
                        onChange={handleChange}
                      />
                      <span>Yes</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="nomineeDirectorsService"
                        value="no"
                        checked={legalEntity.nomineeDirectorsService === "no"}
                        onChange={handleChange}
                      />
                      <span>No</span>
                    </label>
                  </div>

                  {legalEntity.nomineeDirectorsService === "yes" && (
                    <div className="space-y-2 mt-2">
                      <Label>Please justify *</Label>
                      <textarea
                        name="nomineeDirectorsJustification"
                        value={legalEntity.nomineeDirectorsJustification}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Explain why nominee directors are required"
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                  )}
                </div>

                {/* CORPORATE STRUCTURE (Reasons) */}
                <div className="space-y-2">
                  <Label>Purpose for the entity’s corporate structure *</Label>

                  <div className="space-y-3 mt-2 text-sm">
                    {/* Each checkbox */}
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="privacyProtection"
                        checked={legalEntity.corporateReasons.privacyProtection}
                        onChange={handleReasonChange}
                      />
                      <span>Protection of privacy and confidentiality</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="expediteIncorporation"
                        checked={
                          legalEntity.corporateReasons.expediteIncorporation
                        }
                        onChange={handleReasonChange}
                      />
                      <span>Expedit incorporation of the entity</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="estatePlanning"
                        checked={legalEntity.corporateReasons.estatePlanning}
                        onChange={handleReasonChange}
                      />
                      <span>Estate / Succession planning</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="separationManagementOwnership"
                        checked={
                          legalEntity.corporateReasons
                            .separationManagementOwnership
                        }
                        onChange={handleReasonChange}
                      />
                      <span>Separation between management and ownership</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="limitingPublicPresence"
                        checked={
                          legalEntity.corporateReasons.limitingPublicPresence
                        }
                        onChange={handleReasonChange}
                      />
                      <span>
                        Limiting public presence for legitimate considerations
                      </span>
                    </label>

                    {/* Others */}
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="others"
                        checked={legalEntity.corporateReasons.others}
                        onChange={handleReasonChange}
                      />
                      <span>Others</span>
                    </label>

                    {legalEntity.corporateReasons.others && (
                      <textarea
                        name="othersDetail"
                        value={legalEntity.corporateReasons.othersDetail}
                        onChange={(e) =>
                          setLegalEntity((prev) => ({
                            ...prev,
                            corporateReasons: {
                              ...prev.corporateReasons,
                              othersDetail: e.target.value,
                            },
                          }))
                        }
                        rows={3}
                        placeholder="Specify"
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {currentStep.id === "accounting" && (
              <div className="space-y-8">
                {/* ERROR BOX */}
                {stepError && (
                  <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-md text-sm">
                    {stepError}
                  </div>
                )}

                <h3 className="text-lg font-semibold">3. Accounting Records</h3>

                {/* RECORDS KEEPER NAME */}
                <div className="space-y-2">
                  <Label>Name of Records Keeper *</Label>
                  <Input
                    name="accountingRecordsKeeperName"
                    value={legalEntity.accountingRecordsKeeperName}
                    onChange={handleChange}
                    placeholder="Full name or legal entity"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                {/* POSITION */}
                <div className="space-y-2">
                  <Label>Position *</Label>
                  <Input
                    name="accountingRecordsKeeperPosition"
                    value={legalEntity.accountingRecordsKeeperPosition}
                    onChange={handleChange}
                    placeholder="e.g. Accountant, Administrator"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                {/* ADDRESS */}
                <div className="space-y-2">
                  <Label>Address *</Label>
                  <textarea
                    name="accountingRecordsKeeperAddress"
                    value={legalEntity.accountingRecordsKeeperAddress}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Street, Number, Building, Floor, Country"
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                {/* EMAIL */}
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    name="accountingRecordsKeeperEmail"
                    value={legalEntity.accountingRecordsKeeperEmail}
                    onChange={handleChange}
                    placeholder="contact@example.com"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <Label>Phone Number *</Label>

                  <div className="flex gap-3">
                    <SearchableCountrySelect
                      label="Country Code"
                      hideLabel
                      className="w-32"
                      value={
                        legalEntity.accountingRecordsKeeperPhoneCountryCode
                      }
                      showPhoneCode
                      onChange={(newVal, meta) => {
                        setLegalEntity((prev) => ({
                          ...prev,
                          accountingRecordsKeeperPhoneCountryCode: newVal,
                          accountingRecordsKeeperExpectedPhoneLength:
                            meta?.phoneLength || 0,
                        }));
                        setStepError("");
                      }}
                      placeholder="Code"
                    />

                    <Input
                      name="accountingRecordsKeeperPhoneNumber"
                      value={legalEntity.accountingRecordsKeeperPhoneNumber}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "");
                        const expected =
                          legalEntity.accountingRecordsKeeperExpectedPhoneLength ||
                          0;

                        if (expected && digits.length > expected) {
                          setStepError(
                            `Phone number must be exactly ${expected} digits.`
                          );
                          return;
                        }

                        setLegalEntity((prev) => ({
                          ...prev,
                          accountingRecordsKeeperPhoneNumber: digits,
                        }));
                        setStepError("");
                      }}
                      placeholder="Phone number"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Expected length:{" "}
                    {legalEntity.accountingRecordsKeeperExpectedPhoneLength ||
                      "—"}{" "}
                    digits
                  </p>
                </div>
              </div>
            )}

            {currentStep.id === "review" && (
              <div className="space-y-10">
                <h3 className="text-lg font-semibold">
                  4. Review & Sign – Panama Legal Entity Form
                </h3>

                {/* ================================
        SECTION 1 — LEGAL ENTITY INFO
       ================================ */}
                <div className="space-y-4">
                  <h4 className="font-medium text-base">
                    Legal Entity Information
                  </h4>

                  <div className="border rounded-md p-4 space-y-3">
                    <SummaryRow
                      label="Type(s) of asset(s)"
                      value={legalEntity.assetTypes}
                    />
                    <SummaryRow
                      label="Name of the legal entity"
                      value={legalEntity.legalEntityName}
                    />
                    <SummaryRow
                      label="Address of the entity"
                      value={legalEntity.entityAddress}
                    />
                    <SummaryRow
                      label="Main business activity"
                      value={legalEntity.activityDescription}
                    />
                    <SummaryRow
                      label="Country of activity"
                      value={
                        legalEntity.activityCountry
                          ? countries.find(
                              (c) => c.code === legalEntity.activityCountry
                            )?.name
                          : "—"
                      }
                    />
                    <SummaryRow
                      label="Phone"
                      value={
                        legalEntity.phoneCountryCode && legalEntity.phoneNumber
                          ? `${legalEntity.phoneCountryCode} ${legalEntity.phoneNumber}`
                          : "—"
                      }
                    />
                    <SummaryRow label="Email" value={legalEntity.email} />
                  </div>
                </div>

                {/* =========================================
        SECTION 2 — NOMINEE SERVICE + CORPORATE
       ========================================= */}
                <div className="space-y-4">
                  <h4 className="font-medium text-base">
                    Nominee Directors & Corporate Structure
                  </h4>

                  <div className="border rounded-md p-4 space-y-3">
                    <SummaryRow
                      label="Nominee Directors Service"
                      value={
                        legalEntity.nomineeDirectorsService === "yes"
                          ? "Yes"
                          : legalEntity.nomineeDirectorsService === "no"
                          ? "No"
                          : "—"
                      }
                    />

                    {legalEntity.nomineeDirectorsService === "yes" && (
                      <SummaryRow
                        label="Justification"
                        value={legalEntity.nomineeDirectorsJustification}
                      />
                    )}

                    {/* Corporate Reasons */}
                    <div className="pt-2">
                      <Label className="font-medium text-sm">
                        Corporate Structure Reasons
                      </Label>
                      <div className="mt-2 space-y-1 text-sm">
                        {legalEntity.corporateReasons.privacyProtection && (
                          <div>• Protection of privacy & confidentiality</div>
                        )}
                        {legalEntity.corporateReasons.expediteIncorporation && (
                          <div>• Expedit incorporation of the entity</div>
                        )}
                        {legalEntity.corporateReasons.estatePlanning && (
                          <div>• Estate / succession planning</div>
                        )}
                        {legalEntity.corporateReasons
                          .separationManagementOwnership && (
                          <div>
                            • Separation between management and ownership
                          </div>
                        )}
                        {legalEntity.corporateReasons
                          .limitingPublicPresence && (
                          <div>
                            • Limiting public presence for legitimate
                            considerations
                          </div>
                        )}
                        {legalEntity.corporateReasons.others && (
                          <div>
                            • Others:{" "}
                            {legalEntity.corporateReasons.othersDetail}
                          </div>
                        )}

                        {/* If literally NOTHING was selected */}
                        {!Object.values(legalEntity.corporateReasons).some(
                          Boolean
                        ) && (
                          <div className="text-muted-foreground">
                            No reasons selected.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ================================
        SECTION 3 — ACCOUNTING RECORDS
       ================================ */}
                <div className="space-y-4">
                  <h4 className="font-medium text-base">Accounting Records</h4>

                  <div className="border rounded-md p-4 space-y-3">
                    <SummaryRow
                      label="Records keeper name"
                      value={legalEntity.accountingRecordsKeeperName}
                    />
                    <SummaryRow
                      label="Position"
                      value={legalEntity.accountingRecordsKeeperPosition}
                    />
                    <SummaryRow
                      label="Address"
                      value={legalEntity.accountingRecordsKeeperAddress}
                    />
                    <SummaryRow
                      label="Email"
                      value={legalEntity.accountingRecordsKeeperEmail}
                    />
                    <SummaryRow
                      label="Phone"
                      value={
                        legalEntity.accountingRecordsKeeperPhoneCountryCode &&
                        legalEntity.accountingRecordsKeeperPhoneNumber
                          ? `${legalEntity.accountingRecordsKeeperPhoneCountryCode} ${legalEntity.accountingRecordsKeeperPhoneNumber}`
                          : "—"
                      }
                    />
                  </div>
                </div>

                {/* ================================
        SECTION 4 — DECLARATION & SIGNATURE
       ================================ */}
                <div className="space-y-6 border rounded-lg p-6">
                  <h4 className="text-lg font-semibold">Declaration</h4>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    I hereby declare that the information provided in this Legal
                    Entity Form is complete and accurate. I understand that this
                    information is required under Panamanian Law 23 of 2015
                    (“Know Your Client”) and that I must promptly notify the
                    Resident Agent of any changes to this information. I affirm
                    that no part of the assets or activities of the legal entity
                    relate to illegal activity, money laundering, or financing
                    of terrorism.
                  </p>

                  {/* Client Name */}
                  <div className="space-y-2">
                    <Label>Client Name (Full Name) *</Label>
                    <Input
                      name="clientName"
                      value={legalEntity.clientName}
                      onChange={handleChange}
                      placeholder="Enter your full legal name"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>

                  {/* Signature Method */}
                  <div className="space-y-4">
                    <Label className="font-medium">Signature Method *</Label>

                    {!legalEntity.signatureType && signatureMethod === null && (
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

                    {/* Drawing Pad */}
                    {signatureMethod === "draw" &&
                      !legalEntity.signatureType && (
                        <div className="border rounded-lg p-4 space-y-4">
                          <div className="flex justify-between items-center">
                            <Label>Draw your signature below</Label>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={clearSignature}
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
                              variant="outline"
                              onClick={() => setSignatureMethod(null)}
                            >
                              Back
                            </Button>
                            <Button
                              onClick={saveDrawnSignature}
                              disabled={
                                !signaturePreview || isSignatureUploading
                              }
                            >
                              {isSignatureUploading
                                ? "Saving…"
                                : "Save Signature"}
                            </Button>
                          </div>
                        </div>
                      )}

                    {/* Upload signature */}
                    {signatureMethod === "upload" &&
                      !legalEntity.signatureType && (
                        <div className="border rounded-lg p-4 space-y-4">
                          <Label>Upload your signature file</Label>

                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <input
                              id="signatureUploadPanama"
                              type="file"
                              accept=".jpg,.jpeg,.png,.gif"
                              onChange={handleFileUpload}
                              className="hidden"
                            />
                            <label
                              htmlFor="signatureUploadPanama"
                              className="cursor-pointer block"
                            >
                              <p className="text-sm text-blue-600 font-medium">
                                Click to upload
                              </p>
                              <p className="text-xs text-gray-500">
                                PNG, JPG, GIF up to 5MB
                              </p>
                            </label>
                          </div>

                          <Button
                            variant="outline"
                            onClick={() => setSignatureMethod(null)}
                          >
                            Back
                          </Button>
                        </div>
                      )}

                    {/* Signature saved */}
                    {legalEntity.signatureType && (
                      <div className="border rounded-lg p-4 space-y-4">
                        <div className="flex justify-between items-center">
                          <Label>
                            {legalEntity.signatureType === "drawn"
                              ? "Drawn Signature"
                              : "Uploaded Signature"}
                          </Label>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={resetSignature}
                          >
                            Change Signature
                          </Button>
                        </div>

                        {legalEntity.signatureDataUrl && (
                          <div className="bg-white border rounded-lg p-4 flex justify-center">
                            <img
                              src={legalEntity.signatureDataUrl}
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
                  </div>

                  {/* Signed At */}
                  {legalEntity.signatureType && (
                    <div className="bg-green-50 p-3 rounded-lg text-xs space-y-1 text-green-700">
                      <p>✓ Signature Type: {legalEntity.signatureType}</p>
                      <p>
                        Signed At:{" "}
                        {legalEntity.signedAt
                          ? new Date(legalEntity.signedAt).toLocaleString()
                          : "—"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={goBack} disabled={isFirstStep}>
              Back
            </Button>

            <Button onClick={goNext}>
              {isLastStep ? "Continue to Beneficial Owner Form" : "Next"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
