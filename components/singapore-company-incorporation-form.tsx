"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SearchableCountrySelect } from "@/components/searchable-country-select";
import { useDebouncedEffect } from "@/hooks/useDebouncedEffect";
import { useRouter } from "next/navigation";

type SingaporeFormProps = {
  onboardingId: string;
  jurisdiction: string;
};

type Shareholder = {
  fullName: string;
  shares: string;
  pricePerShare: string;
  idNumber: string;
  idType: string;
  nationality: string;
  address: string;
  phoneCountryCode: string;
  phoneNumber: string;
  expectedPhoneLength: number;
  email: string;
};

type Director = {
  fullName: string;
  idNumber: string;
  idType: string;
  nationality: string;
  address: string;
  phoneCountryCode: string;
  phoneNumber: string;
  expectedPhoneLength: number;
  email: string;
};

// ---------------- STEP DEFINITIONS ----------------
const SG_STEPS = [
  { id: "companyDetails", title: "Company Details" },
  { id: "shareholders", title: "Shareholders" },
  { id: "directors", title: "Directors" },
  { id: "review", title: "Review & Signature" },
] as const;

/// ---------------- BVI-STYLE SIGNATURE PAD ----------------
type SignaturePadProps = {
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
  initialDataUrl?: string;
};

export function SignaturePad({
  onSave,
  onCancel,
  initialDataUrl,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawing, setHasDrawing] = useState(false);

  // Load existing signature
  useEffect(() => {
    if (!initialDataUrl || !canvasRef.current) return;
    const img = new Image();
    img.onload = () => {
      const c = canvasRef.current!;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      setHasDrawing(true);
    };
    img.src = initialDataUrl;
  }, [initialDataUrl]);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawing(true);
  };

  const handleMouseUp = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawing(false);
  };

  const handleSave = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    onSave(dataUrl);
  };

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-slate-900 border-gray-700">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Label className="font-medium">Draw your signature below</Label>
        <Button variant="outline" size="sm" onClick={clearCanvas}>
          Clear
        </Button>
      </div>

      {/* Canvas */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white">
        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          className="bg-white cursor-crosshair w-full rounded-md"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>

      {/* Footer buttons */}
      <div className="flex gap-4">
        <Button variant="outline" onClick={onCancel}>
          Back
        </Button>
        <Button onClick={handleSave} disabled={!hasDrawing}>
          Save Signature
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Use your mouse or trackpad to draw your signature, then click “Save
        Signature”.
      </p>
    </div>
  );
}

// ---------------- MAIN FORM COMPONENT ----------------
export default function SingaporeCompanyIncorporationForm({
  onboardingId,
  jurisdiction,
}: SingaporeFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepError, setStepError] = useState("");

  const progress = ((currentStep + 1) / SG_STEPS.length) * 100;
  const isFirst = currentStep === 0;
  const isLast = currentStep === SG_STEPS.length - 1;
  const router = useRouter();

  // ---------------------------------------------------------
  // MASTER STATE — All Singapore fields stored together
  // ---------------------------------------------------------
  const [sg, setSG] = useState<{
    intendedName: string;
    altName1: string;
    altName2: string;
    activities: string[];
    customActivity: string;
    registeredAddress: string;
    financialYearEnd: string;
    constitutionType: string;
    customConstitution: string;
    shareholders: Shareholder[];
    directors: Director[];
    signatureType: string;
    signatureDataUrl: string;
    signatureFileName: string;
    signedAt: string;
  }>({
    // STEP 1 — COMPANY DETAILS
    intendedName: "",
    altName1: "",
    altName2: "",
    activities: [],
    customActivity: "",
    registeredAddress: "",
    financialYearEnd: "",
    constitutionType: "",
    customConstitution: "",

    // STEP 2 — SHAREHOLDERS (dynamic table)
    shareholders: [
      {
        fullName: "",
        shares: "",
        pricePerShare: "",
        idNumber: "",
        idType: "",
        nationality: "",
        address: "",
        phoneCountryCode: "",
        phoneNumber: "",
        expectedPhoneLength: 0,
        email: "",
      },
    ],

    // STEP 3 — DIRECTORS (dynamic table)
    directors: [
      {
        fullName: "",
        idNumber: "",
        idType: "",
        nationality: "",
        address: "",
        phoneCountryCode: "",
        phoneNumber: "",
        expectedPhoneLength: 0,
        email: "",
      },
    ],

    // SIGNATURE
    signatureType: "",
    signatureDataUrl: "",
    signatureFileName: "",
    signedAt: "",
  });

  // ---------------------------------------------------------
  // SIGNATURE STATE (BVI-style)
  // ---------------------------------------------------------
  const [signatureMethod, setSignatureMethod] = useState<
    null | "draw" | "upload"
  >(null);
  const [isSignatureUploading, setIsSignatureUploading] = useState(false);

  // Reset signature data
  function resetSignature() {
    setSG((prev) => ({
      ...prev,
      signatureType: "",
      signatureDataUrl: "",
      signatureFileName: "",
      signedAt: "",
    }));
    setSignatureMethod(null);
  }

  // Handle uploaded signature file
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSignatureUploading(true);

    const reader = new FileReader();
    reader.onload = (ev) => {
      setSG((prev) => ({
        ...prev,
        signatureDataUrl: ev.target?.result as string,
        signatureType: "uploaded",
        signatureFileName: file.name,
        signedAt: new Date().toISOString(),
      }));

      setIsSignatureUploading(false);
      setSignatureMethod(null);
    };

    reader.readAsDataURL(file);
  }

  // ---------------------------------------------------------
  // SHAREHOLDER HELPERS
  // ---------------------------------------------------------
  const addShareholder = () => {
    setSG((prev) => ({
      ...prev,
      shareholders: [
        ...prev.shareholders,
        {
          fullName: "",
          shares: "",
          pricePerShare: "",
          idNumber: "",
          idType: "",
          nationality: "",
          address: "",
          phoneCountryCode: "",
          phoneNumber: "",
          expectedPhoneLength: 0,
          email: "",
        },
      ],
    }));
  };

  const removeShareholder = (index: number) => {
    setSG((prev) => ({
      ...prev,
      shareholders: prev.shareholders.filter((_, i) => i !== index),
    }));
  };

  const updateShareholder = (
    index: number,
    field: keyof Shareholder,
    value: any
  ) => {
    setSG((prev) => {
      const updated = [...prev.shareholders];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, shareholders: updated };
    });
  };

  // ---------------------------------------------------------
  // DIRECTOR HELPERS
  // ---------------------------------------------------------
  const addDirector = () => {
    setSG((prev) => ({
      ...prev,
      directors: [
        ...prev.directors,
        {
          fullName: "",
          idNumber: "",
          idType: "",
          nationality: "",
          address: "",
          phoneCountryCode: "",
          phoneNumber: "",
          expectedPhoneLength: 0,
          email: "",
        },
      ],
    }));
  };

  const removeDirector = (index: number) => {
    setSG((prev) => ({
      ...prev,
      directors: prev.directors.filter((_, i) => i !== index),
    }));
  };

  const updateDirector = (index: number, field: keyof Director, value: any) => {
    setSG((prev) => {
      const updated = [...prev.directors];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, directors: updated };
    });
  };

  // ---------------------------------------------------------
  // STEP NAVIGATION
  // ---------------------------------------------------------
  function goNext() {
    if (!validateStep()) {
      setStepError("Please complete all required fields.");
      return;
    }
    setStepError("");
    if (!isLast) setCurrentStep((s) => s + 1);
  }

  function goBack() {
    if (!isFirst) setCurrentStep((s) => s - 1);
  }

  // ---------------------------------------------------------
  // VALIDATION
  // ---------------------------------------------------------
  function validateStep() {
    const stepId = SG_STEPS[currentStep].id;

    if (stepId === "companyDetails") {
      if (!sg.intendedName.trim()) return false;
      if (!sg.activities.length) return false;
      if (sg.activities.length > 2) return false;
      if (!sg.registeredAddress.trim()) return false;
      if (!sg.financialYearEnd.trim()) return false;
      if (!sg.constitutionType.trim()) return false;
    }

    if (stepId === "shareholders") {
      if (sg.shareholders.length === 0) return false;
      for (let sh of sg.shareholders) {
        if (!sh.fullName.trim()) return false;
        if (!sh.shares.trim()) return false;
        if (!sh.pricePerShare.trim()) return false;
        if (!sh.idNumber.trim()) return false;
        if (!sh.idType.trim()) return false;
        if (!sh.nationality) return false;
        if (!sh.address.trim()) return false;
        if (!sh.phoneNumber.trim()) return false;
        if (!sh.email.trim()) return false;
      }
    }

    if (stepId === "directors") {
      if (sg.directors.length === 0) return false;
      for (let d of sg.directors) {
        if (!d.fullName.trim()) return false;
        if (!d.idNumber.trim()) return false;
        if (!d.idType.trim()) return false;
        if (!d.nationality) return false;
        if (!d.address.trim()) return false;
        if (!d.phoneNumber.trim()) return false;
        if (!d.email.trim()) return false;
      }
    }

    if (stepId === "review") {
      if (!sg.signatureType) return false;
      if (!sg.signatureDataUrl) return false;
    }

    return true;
  }

  // ---------------------------------------------------------
  // FINAL SUBMIT — goes to pricing after save
  // ---------------------------------------------------------
  // FINAL SUBMIT — save all Singapore form 1 data then go to declaration
  async function submitFinal() {
    setStepError("");

    try {
      // 1️⃣ Save Company Details
      let res = await fetch(
        "/api/company-incorporation/singapore/company-details",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            onboardingId,
            jurisdiction,
            data: sg,
          }),
        }
      );
      if (!res.ok) throw new Error("Failed to save company details");

      // 2️⃣ Save Shareholders
      res = await fetch("/api/company-incorporation/singapore/shareholders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onboardingId,
          jurisdiction,
          data: sg.shareholders,
        }),
      });
      if (!res.ok) throw new Error("Failed to save shareholders");

      // 3️⃣ Save Directors
      res = await fetch("/api/company-incorporation/singapore/directors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onboardingId,
          jurisdiction,
          data: sg.directors,
        }),
      });
      if (!res.ok) throw new Error("Failed to save directors");

      // 4️⃣ Redirect to Declaration Form (NEW!)
      router.push(
        `/company-incorporation/singapore/declaration?onboardingId=${onboardingId}`
      );
    } catch (err) {
      console.error(err);
      setStepError("Unexpected error — please try again.");
    }
  }

  // ==========================
  // AUTOSAVE — PRODUCTION ONLY
  // ==========================
  useDebouncedEffect(
    () => {
      if (process.env.NODE_ENV !== "production") return;
      if (!onboardingId) return;

      fetch("/api/company-incorporation/singapore/company-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onboardingId,
          jurisdiction,
          data: {
            intendedName: sg.intendedName,
            altName1: sg.altName1,
            altName2: sg.altName2,
            activities: sg.activities,
            customActivity: sg.customActivity,
            registeredAddress: sg.registeredAddress,
            financialYearEnd: sg.financialYearEnd,
            constitutionType: sg.constitutionType,
            customConstitution: sg.customConstitution,
          },
        }),
      });
    },
    [
      sg.intendedName,
      sg.altName1,
      sg.altName2,
      sg.activities,
      sg.customActivity,
      sg.registeredAddress,
      sg.financialYearEnd,
      sg.constitutionType,
      sg.customConstitution,
    ],
    800
  );

  useDebouncedEffect(
    () => {
      if (process.env.NODE_ENV !== "production") return;
      if (!onboardingId) return;

      fetch("/api/company-incorporation/singapore/shareholders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onboardingId,
          jurisdiction,
          data: sg.shareholders,
        }),
      });
    },
    [sg.shareholders],
    800
  );

  useDebouncedEffect(
    () => {
      if (process.env.NODE_ENV !== "production") return;
      if (!onboardingId) return;

      fetch("/api/company-incorporation/singapore/directors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onboardingId,
          jurisdiction,
          data: sg.directors,
        }),
      });
    },
    [sg.directors],
    800
  );

  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------
  return (
    <div className="max-w-4xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Singapore Company Incorporation</CardTitle>
        </CardHeader>

        <CardContent>
          {/* Progress */}
          <div className="space-y-2 mb-6">
            <Progress value={progress} className="w-full" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                Step {currentStep + 1} of {SG_STEPS.length}
              </span>
              <span>{SG_STEPS[currentStep].title}</span>
            </div>
          </div>

          {/* STEP CONTENT */}
          <div className="border rounded-md p-4 mb-6">
            {/* STEP 1: COMPANY DETAILS */}
            {SG_STEPS[currentStep].id === "companyDetails" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">1. Company Details</h3>

                {/* Intended Company Name */}
                <div className="space-y-2">
                  <Label>Intended Company Name *</Label>
                  <Input
                    value={sg.intendedName}
                    onChange={(e) =>
                      setSG((prev) => ({
                        ...prev,
                        intendedName: e.target.value,
                      }))
                    }
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                {/* Alt Names */}
                <div className="space-y-2">
                  <Label>Alternative Company Name 1 (Optional)</Label>
                  <Input
                    value={sg.altName1}
                    onChange={(e) =>
                      setSG((prev) => ({ ...prev, altName1: e.target.value }))
                    }
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Alternative Company Name 2 (Optional)</Label>
                  <Input
                    value={sg.altName2}
                    onChange={(e) =>
                      setSG((prev) => ({ ...prev, altName2: e.target.value }))
                    }
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                {/* Activities */}
                <div className="space-y-3">
                  <Label>
                    Company Activities *{" "}
                    <span className="text-xs text-muted-foreground">
                      (max 2)
                    </span>
                  </Label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      "62021 - IT Consultancy (Except Cybersecurity)",
                      "62022 - Cybersecurity Consultancy",
                      "62011 - Software Development (Non-Games)",
                      "58201 - Publishing of Games Software",
                      "58202 - Publishing (Non-Games)",
                    ].map((activity) => (
                      <label
                        key={activity}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={sg.activities.includes(activity)}
                          onChange={() => {
                            setSG((prev) => {
                              let newActivities = [...prev.activities];

                              if (newActivities.includes(activity)) {
                                newActivities = newActivities.filter(
                                  (a) => a !== activity
                                );
                              } else {
                                if (newActivities.length >= 2) return prev;
                                newActivities.push(activity);
                              }

                              return { ...prev, activities: newActivities };
                            });
                          }}
                        />
                        <span className="text-sm">{activity}</span>
                      </label>
                    ))}
                  </div>

                  {/* Custom activity */}
                  <div className="space-y-2">
                    <Label>Other Activity (Optional)</Label>
                    <Textarea
                      placeholder="Provide SSIC code(s) or describe intended activities"
                      value={sg.customActivity}
                      onChange={(e) =>
                        setSG((prev) => ({
                          ...prev,
                          customActivity: e.target.value,
                        }))
                      }
                      rows={3}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                {/* Registered Address */}
                <div className="space-y-2">
                  <Label>Intended Registered Address *</Label>
                  <Textarea
                    value={sg.registeredAddress}
                    onChange={(e) =>
                      setSG((prev) => ({
                        ...prev,
                        registeredAddress: e.target.value,
                      }))
                    }
                    rows={2}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                {/* Financial Year End */}
                <div className="space-y-2">
                  <Label>Financial Year End *</Label>
                  <Input
                    type="date"
                    value={sg.financialYearEnd}
                    onChange={(e) =>
                      setSG((prev) => ({
                        ...prev,
                        financialYearEnd: e.target.value,
                      }))
                    }
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Please choose a date at least 12 months ahead.
                  </p>
                </div>

                {/* Constitution Options */}
                <div className="space-y-2">
                  <Label>Constitution to be Adopted *</Label>

                  <div className="flex flex-col gap-2">
                    {[
                      {
                        id: "generic",
                        label: "Generic Constitution (recommended)",
                      },
                      {
                        id: "shareholderAgreements",
                        label:
                          "Custom constitution with shareholder agreements",
                      },
                      {
                        id: "other",
                        label: "Other (Please specify)",
                      },
                    ].map((opt) => (
                      <label key={opt.id} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="constitutionType"
                          value={opt.id}
                          checked={sg.constitutionType === opt.id}
                          onChange={(e) =>
                            setSG((prev) => ({
                              ...prev,
                              constitutionType: e.target.value,
                            }))
                          }
                        />
                        <span className="text-sm">{opt.label}</span>
                      </label>
                    ))}
                  </div>

                  {sg.constitutionType === "other" && (
                    <Textarea
                      placeholder="Describe the constitution type"
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={sg.customConstitution || ""}
                      onChange={(e) =>
                        setSG((prev) => ({
                          ...prev,
                          customConstitution: e.target.value,
                        }))
                      }
                    />
                  )}
                </div>
              </div>
            )}

            {/* SECTION 2: Shareholders */}
            {SG_STEPS[currentStep].id === "shareholders" && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">2. Shareholders</h3>

                {sg.shareholders.map((sh, index) => (
                  <div
                    key={index}
                    className="border border-gray-700 p-5 rounded-lg space-y-4 bg-slate-900 shadow-sm"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-lg">
                        Shareholder {index + 1}
                      </h4>

                      {index > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeShareholder(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>

                    {/* NAME */}
                    <div className="space-y-1">
                      <Label>Full Name *</Label>
                      <Input
                        value={sh.fullName}
                        onChange={(e) =>
                          updateShareholder(index, "fullName", e.target.value)
                        }
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>

                    {/* SHARES */}
                    <div className="space-y-1">
                      <Label>No. of Shares *</Label>
                      <Input
                        type="number"
                        value={sh.shares}
                        onChange={(e) =>
                          updateShareholder(index, "shares", e.target.value)
                        }
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>

                    {/* PRICE PER SHARE */}
                    <div className="space-y-1">
                      <Label>Price per Share *</Label>
                      <Input
                        type="number"
                        value={sh.pricePerShare}
                        onChange={(e) =>
                          updateShareholder(
                            index,
                            "pricePerShare",
                            e.target.value
                          )
                        }
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>

                    {/* ID TYPE */}
                    <div className="space-y-1">
                      <Label>ID Type *</Label>
                      <select
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={sh.idType}
                        onChange={(e) =>
                          updateShareholder(index, "idType", e.target.value)
                        }
                      >
                        <option value="">Select</option>
                        <option value="Passport">Passport</option>
                        <option value="NRIC">NRIC</option>
                      </select>
                    </div>

                    {/* ID NUMBER */}
                    <div className="space-y-1">
                      <Label>ID Number *</Label>
                      <Input
                        value={sh.idNumber}
                        onChange={(e) =>
                          updateShareholder(index, "idNumber", e.target.value)
                        }
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>

                    {/* NATIONALITY */}
                    <div className="space-y-1">
                      <Label>Nationality *</Label>
                      <SearchableCountrySelect
                        label="Nationality"
                        hideLabel
                        value={sh.nationality}
                        onChange={(val) =>
                          updateShareholder(index, "nationality", val)
                        }
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>

                    {/* ADDRESS */}
                    <div className="space-y-1">
                      <Label>Residential / Registered Address *</Label>
                      <Textarea
                        rows={3}
                        value={sh.address}
                        onChange={(e) =>
                          updateShareholder(index, "address", e.target.value)
                        }
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>

                    {/* PHONE */}
                    <div className="space-y-1">
                      <Label>Telephone *</Label>

                      <div className="flex gap-3">
                        <SearchableCountrySelect
                          label="Phone Code"
                          hideLabel
                          showPhoneCode
                          value={sh.phoneCountryCode}
                          onChange={(code, meta) => {
                            updateShareholder(index, "phoneCountryCode", code);
                            updateShareholder(
                              index,
                              "expectedPhoneLength",
                              meta?.phoneLength || 0
                            );
                          }}
                          className="w-32"
                        />

                        <Input
                          value={sh.phoneNumber}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, "");
                            if (
                              sh.expectedPhoneLength &&
                              digits.length > sh.expectedPhoneLength
                            )
                              return;

                            updateShareholder(index, "phoneNumber", digits);
                          }}
                          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Expected digits: {sh.expectedPhoneLength || "—"}
                      </p>
                    </div>

                    {/* EMAIL */}
                    <div className="space-y-1">
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        value={sh.email}
                        onChange={(e) =>
                          updateShareholder(index, "email", e.target.value)
                        }
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                ))}

                {/* ADD SHAREHOLDER */}
                <Button variant="secondary" onClick={addShareholder}>
                  + Add Another Shareholder
                </Button>
              </div>
            )}

            {/* SECTION 3: Directors */}
            {SG_STEPS[currentStep].id === "directors" && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">3. Directors</h3>

                {sg.directors.map((d, index) => (
                  <div
                    key={index}
                    className="border border-gray-700 p-5 rounded-lg space-y-4 bg-slate-900 shadow-sm"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-lg">
                        Director {index + 1}
                      </h4>

                      {index > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeDirector(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>

                    {/* FULL NAME */}
                    <div className="space-y-1">
                      <Label>Full Name *</Label>
                      <Input
                        value={d.fullName}
                        onChange={(e) =>
                          updateDirector(index, "fullName", e.target.value)
                        }
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>

                    {/* ID TYPE */}
                    <div className="space-y-1">
                      <Label>ID Type *</Label>
                      <select
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={d.idType}
                        onChange={(e) =>
                          updateDirector(index, "idType", e.target.value)
                        }
                      >
                        <option value="">Select</option>
                        <option value="Passport">Passport</option>
                        <option value="NRIC">NRIC</option>
                        <option value="FIN">FIN</option>
                      </select>
                    </div>

                    {/* ID NUMBER */}
                    <div className="space-y-1">
                      <Label>ID Number *</Label>
                      <Input
                        value={d.idNumber}
                        onChange={(e) =>
                          updateDirector(index, "idNumber", e.target.value)
                        }
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>

                    {/* NATIONALITY */}
                    <div className="space-y-1">
                      <Label>Nationality *</Label>
                      <SearchableCountrySelect
                        label="Nationality"
                        hideLabel
                        value={d.nationality}
                        onChange={(val) =>
                          updateDirector(index, "nationality", val)
                        }
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>

                    {/* ADDRESS */}
                    <div className="space-y-1">
                      <Label>Residential Address *</Label>
                      <Textarea
                        rows={3}
                        value={d.address}
                        onChange={(e) =>
                          updateDirector(index, "address", e.target.value)
                        }
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>

                    {/* PHONE */}
                    <div className="space-y-1">
                      <Label>Telephone *</Label>

                      <div className="flex gap-3">
                        <SearchableCountrySelect
                          label="Phone Code"
                          hideLabel
                          showPhoneCode
                          value={d.phoneCountryCode}
                          onChange={(code, meta) => {
                            updateDirector(index, "phoneCountryCode", code);
                            updateDirector(
                              index,
                              "expectedPhoneLength",
                              meta?.phoneLength || 0
                            );
                          }}
                          className="w-32"
                        />

                        <Input
                          value={d.phoneNumber}
                          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, "");
                            if (
                              d.expectedPhoneLength &&
                              digits.length > d.expectedPhoneLength
                            )
                              return;

                            updateDirector(index, "phoneNumber", digits);
                          }}
                        />
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Expected digits: {d.expectedPhoneLength || "—"}
                      </p>
                    </div>

                    {/* EMAIL */}
                    <div className="space-y-1">
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        value={d.email}
                        onChange={(e) =>
                          updateDirector(index, "email", e.target.value)
                        }
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                ))}

                {/* ADD DIRECTOR */}
                <Button variant="secondary" onClick={addDirector}>
                  + Add Another Director
                </Button>
              </div>
            )}
            {/* SECTION 4: Review & Signature */}
            {SG_STEPS[currentStep].id === "review" && (
              <div className="space-y-10 mt-10">
                <h3 className="text-xl font-semibold">4. Review & Signature</h3>

                {/* ===================== SUMMARY SECTION ===================== */}
                <div className="space-y-8">
                  {/* Company */}
                  <div>
                    <h4 className="font-medium mb-2">Company Details</h4>
                    <div className="border border-gray-700 rounded-lg p-4 bg-slate-900 space-y-1 text-sm">
                      <p>
                        <strong>Intended Name:</strong> {sg.intendedName || "—"}
                      </p>
                      <p>
                        <strong>Activities:</strong>{" "}
                        {sg.activities.join(", ") || "—"}
                      </p>
                      <p>
                        <strong>Registered Address:</strong>{" "}
                        {sg.registeredAddress || "—"}
                      </p>
                      <p>
                        <strong>Financial Year End:</strong>{" "}
                        {sg.financialYearEnd || "—"}
                      </p>
                      <p>
                        <strong>Constitution:</strong> {sg.constitutionType}
                      </p>
                    </div>
                  </div>

                  {/* Shareholders */}
                  <div>
                    <h4 className="font-medium mb-2">Shareholders</h4>
                    {sg.shareholders.map((sh, idx) => (
                      <div
                        key={idx}
                        className="border border-gray-700 rounded-lg p-4 bg-slate-900 text-sm space-y-1"
                      >
                        <p>
                          <strong>Name:</strong> {sh.fullName}
                        </p>
                        <p>
                          <strong>Shares:</strong> {sh.shares}
                        </p>
                        <p>
                          <strong>Price/Share:</strong> {sh.pricePerShare}
                        </p>
                        <p>
                          <strong>ID:</strong> {sh.idType} – {sh.idNumber}
                        </p>
                        <p>
                          <strong>Nationality:</strong> {sh.nationality}
                        </p>
                        <p>
                          <strong>Address:</strong> {sh.address}
                        </p>
                        <p>
                          <strong>Phone:</strong> +{sh.phoneCountryCode}{" "}
                          {sh.phoneNumber}
                        </p>
                        <p>
                          <strong>Email:</strong> {sh.email}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Directors */}
                  <div>
                    <h4 className="font-medium mb-2">Directors</h4>
                    {sg.directors.map((d, idx) => (
                      <div
                        key={idx}
                        className="border border-gray-700 rounded-lg p-4 bg-slate-900 text-sm space-y-1"
                      >
                        <p>
                          <strong>Name:</strong> {d.fullName}
                        </p>
                        <p>
                          <strong>ID:</strong> {d.idType} – {d.idNumber}
                        </p>
                        <p>
                          <strong>Nationality:</strong> {d.nationality}
                        </p>
                        <p>
                          <strong>Address:</strong> {d.address}
                        </p>
                        <p>
                          <strong>Phone:</strong> +{d.phoneCountryCode}{" "}
                          {d.phoneNumber}
                        </p>
                        <p>
                          <strong>Email:</strong> {d.email}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ===================== SIGNATURE SECTION ===================== */}
                <div className="space-y-6 border rounded-lg p-6">
                  <h4 className="text-lg font-semibold">Signature</h4>

                  <Label className="font-medium">Signature Method *</Label>

                  {/* Select Signature Method */}
                  {!sg.signatureType && signatureMethod === null && (
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

                  {/* DRAW MODE */}
                  {signatureMethod === "draw" && !sg.signatureType && (
                    <SignaturePad
                      initialDataUrl={sg.signatureDataUrl}
                      onSave={(dataUrl) =>
                        setSG((prev) => ({
                          ...prev,
                          signatureDataUrl: dataUrl,
                          signatureType: "drawn",
                          signedAt: new Date().toISOString(),
                        }))
                      }
                      onCancel={() => setSignatureMethod(null)}
                    />
                  )}

                  {/* UPLOAD MODE */}
                  {signatureMethod === "upload" && !sg.signatureType && (
                    <div className="border rounded-lg p-4 space-y-4 bg-slate-900 border-gray-700">
                      <Label>Upload your signature file</Label>

                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <input
                          id="sgSignatureUpload"
                          type="file"
                          accept=".jpg,.jpeg,.png,.gif"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <label
                          htmlFor="sgSignatureUpload"
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

                  {/* SAVED SIGNATURE */}
                  {sg.signatureType && (
                    <div className="border rounded-lg p-4 space-y-4 bg-slate-900 border-gray-700">
                      <div className="flex justify-between items-center">
                        <Label>
                          {sg.signatureType === "drawn"
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

                      {sg.signatureDataUrl && (
                        <div className="bg-white border rounded-lg p-4 flex justify-center">
                          <img
                            src={sg.signatureDataUrl}
                            alt="Signature preview"
                            className="max-h-32 max-w-full"
                          />
                        </div>
                      )}

                      <p className="text-xs text-green-500">
                        ✓ Signature saved successfully
                      </p>
                    </div>
                  )}

                  {/* VERIFIED BLOCK */}
                  {sg.signatureType && (
                    <div className="bg-green-50 p-3 rounded-lg text-xs text-green-700">
                      <p>✓ Signature Type: {sg.signatureType}</p>
                      <p>
                        Signed At:{" "}
                        {sg.signedAt
                          ? new Date(sg.signedAt).toLocaleString()
                          : "—"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ERRORS */}
          {stepError && (
            <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-md mb-4">
              {stepError}
            </div>
          )}

          {/* NAVIGATION */}
          <div className="flex justify-between">
            <Button variant="outline" disabled={isFirst} onClick={goBack}>
              Back
            </Button>

            {!isLast ? (
              <Button onClick={goNext}>Next</Button>
            ) : (
              <Button onClick={submitFinal}>Submit Singapore Form</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
