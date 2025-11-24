// components/cayman-due-diligence-form.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export interface CaymanDueDiligenceData {
  individuals: Array<{
    fullName: string;
    nationality: string;
    address: string;
    dateOfBirth: string;
    idNumber: string;
    idExpiry: string;
    occupation: string;
    pep: boolean;
  }>;

  pepDetails: {
    isPEP: string;
    explanation: string;
  };

  convictions: {
    hasConviction: string;
    details: string;
  };

  sourceOfFunds: {
    selected: string[];
    details: {
      familyFortune?: { description: string; netWorth: string };
      activeEntrepreneurial?: {
        companyName: string;
        businessDescription: string;
        address: string;
        website?: string;
        netWorth: string;
      };
      formerEntrepreneurial?: {
        companyName: string;
        saleDetails: string;
        netWorth: string;
      };
      income?: {
        employer: string;
        salaryRange: string;
        otherIncome: string;
      };
      other?: {
        explanation: string;
      };
    };
  };

  // Top-level metadata (for API / prisma)
  signature?: string;
  signed?: boolean;
  signatureType?: "drawn" | "uploaded" | null;
  signatureFileName?: string;
  signedAt?: string;
  completedByName?: string;

  // Full declaration block (for BVI-style signature UI)
  declaration?: {
    completedByName: string;
    signatureType: "drawn" | "uploaded" | null;
    signature: string;
    signatureFileName: string;
    signatureDataUrl: string;
    signatureFile: File | null;
    signedAt?: string;
  };
}

interface CaymanDueDiligenceFormProps {
  onboardingId: string;
  jurisdiction: string;
  initialData: CaymanDueDiligenceData;
}

const FORM_STEPS = [
  { id: "dd", title: "1. Due Diligence Info" },
  { id: "sof", title: "2. Source of Funds" },
  { id: "review", title: "3. Review & Submit" },
];

export default function CaymanDueDiligenceForm({
  onboardingId,
  jurisdiction,
  initialData,
}: CaymanDueDiligenceFormProps) {
  const router = useRouter();

  // ------------- STEP STATE -------------
  const [currentStep, setCurrentStep] = useState(0);
  const currentStepId = FORM_STEPS[currentStep].id;
  const progress = ((currentStep + 1) / FORM_STEPS.length) * 100;

  // ------------- SIGNATURE STATE (BVI STYLE) -------------
  const [signatureMethod, setSignatureMethod] = useState<
    "draw" | "upload" | null
  >(null);
  const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signaturePreview, setSignaturePreview] = useState<string>("");
  const [isSignatureUploading, setIsSignatureUploading] = useState(false);
  const [error, setError] = useState<string>("");

  // ------------- FORM STATE -------------
  const [formData, setFormData] = useState<CaymanDueDiligenceData>({
    individuals: initialData.individuals || [],
    pepDetails: initialData.pepDetails || {
      isPEP: "",
      explanation: "",
    },
    convictions: initialData.convictions || {
      hasConviction: "",
      details: "",
    },
    sourceOfFunds:
      initialData.sourceOfFunds ||
      ({
        selected: [],
        details: {},
      } as any),
    signature: initialData.signature || "",
    signed: initialData.signed || false,
    signatureType: initialData.signatureType ?? null,
    signatureFileName: initialData.signatureFileName || "",
    signedAt: initialData.signedAt || "",
    completedByName: initialData.completedByName || "",
    declaration: initialData.declaration || {
      completedByName: initialData.completedByName || "",
      signatureType: initialData.signatureType ?? null,
      signature: initialData.signature || "",
      signatureFileName: initialData.signatureFileName || "",
      signatureDataUrl: "",
      signatureFile: null,
      signedAt: initialData.signedAt || "",
    },
  });

  // If there is an existing signature, load preview (for images only, best effort)
  useEffect(() => {
    if (formData.declaration?.signatureDataUrl) {
      setSignaturePreview(formData.declaration.signatureDataUrl);
    }
  }, [formData.declaration?.signatureDataUrl]);

  // ------------- AUTOSAVE (PRODUCTION ONLY) -------------
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!onboardingId) return;

    const t = setTimeout(() => {
      fetch("/api/company-incorporation/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onboardingId,
          jurisdiction: "CAYMAN",
          caymanDueDiligence: formData,
        }),
      });
    }, 700);

    return () => clearTimeout(t);
  }, [formData, onboardingId]);

  // ------------- STEP CONTROLS -------------
  function nextStep() {
    if (currentStep < FORM_STEPS.length - 1) setCurrentStep((s) => s + 1);
  }

  function prevStep() {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }

  // ------------- HELPERS: Individuals -------------
  function addIndividual() {
    setFormData((prev) => ({
      ...prev,
      individuals: [
        ...(prev.individuals || []),
        {
          fullName: "",
          nationality: "",
          address: "",
          dateOfBirth: "",
          idNumber: "",
          idExpiry: "",
          occupation: "",
          pep: false,
        },
      ],
    }));
  }

  function updateIndividual(
    index: number,
    partial: Partial<CaymanDueDiligenceData["individuals"][number]>
  ) {
    setFormData((prev) => {
      const list = [...(prev.individuals || [])];
      list[index] = { ...list[index], ...partial };
      return { ...prev, individuals: list };
    });
  }

  // ------------- HELPERS: Source of Funds -------------
  function updateSof(
    partial: Partial<CaymanDueDiligenceData["sourceOfFunds"]>
  ) {
    setFormData((prev) => ({
      ...prev,
      sourceOfFunds: {
        ...(prev.sourceOfFunds || { selected: [], details: {} }),
        ...partial,
      },
    }));
  }

  function updateSofDetail(section: string, field: string, value: string) {
    setFormData((prev) => ({
      ...prev,
      sourceOfFunds: {
        ...(prev.sourceOfFunds || { selected: [], details: {} }),
        details: {
          ...(prev.sourceOfFunds?.details || {}),
          [section]: {
            ...(prev.sourceOfFunds?.details?.[section] || {}),
            [field]: value,
          },
        },
      },
    }));
  }

  // ------------- HELPERS: PEP & Convictions -------------
  function updatePepDetails(
    partial: Partial<CaymanDueDiligenceData["pepDetails"]>
  ) {
    setFormData((prev) => ({
      ...prev,
      pepDetails: {
        ...(prev.pepDetails || { isPEP: "", explanation: "" }),
        ...partial,
      },
    }));
  }

  function updateConvictions(
    partial: Partial<CaymanDueDiligenceData["convictions"]>
  ) {
    setFormData((prev) => ({
      ...prev,
      convictions: {
        ...(prev.convictions || { hasConviction: "", details: "" }),
        ...partial,
      },
    }));
  }

  // ------------- HELPERS: Declaration / Signature (BVI style) -------------
  const defaultDeclaration = {
    completedByName: "",
    signatureType: null as "drawn" | "uploaded" | null,
    signature: "",
    signatureFileName: "",
    signatureDataUrl: "",
    signatureFile: null as File | null,
    signedAt: "",
  };

  function handleDeclarationChange(field: string, value: any) {
    setFormData((prev) => {
      const decl = {
        ...(prev.declaration || defaultDeclaration),
        [field]: value,
      };

      return {
        ...prev,
        declaration: decl,
        // Keep top-level compatibility for backend
        ...(field === "completedByName" ? { completedByName: value } : {}),
      };
    });
  }

  // Canvas drawing handlers (BVI logic)
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef) return;

    const canvas = canvasRef;
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
    if (!isDrawing || !canvasRef) return;

    const canvas = canvasRef;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!canvasRef) return;

    const canvas = canvasRef;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.closePath();
    setIsDrawing(false);

    const dataUrl = canvas.toDataURL();
    setSignaturePreview(dataUrl);
  };

  const clearSignature = () => {
    if (canvasRef) {
      const ctx = canvasRef.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.width, canvasRef.height);
      }
    }

    setSignaturePreview("");
    setSignatureMethod(null);

    setFormData((prev) => ({
      ...prev,
      declaration: {
        ...(prev.declaration || defaultDeclaration),
        signatureType: null,
        signature: "",
        signatureFileName: "",
        signatureDataUrl: "",
        signatureFile: null,
      },
      signature: "",
      signatureType: null,
      signatureFileName: "",
      signed: false,
      signedAt: "",
    }));
  };

  async function saveDrawnSignature() {
    if (!canvasRef) return;

    try {
      const dataUrl = canvasRef.toDataURL("image/png");

      setFormData((prev) => ({
        ...prev,
        signature: dataUrl,
        signatureType: "drawn",
        signatureFileName: "drawn-signature.png",
        signed: true,
      }));

      setSignaturePreview(dataUrl);
      setSignatureMethod(null);
    } catch (err) {
      console.error(err);
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
    ];
    if (!validTypes.includes(file.type)) {
      alert("Please upload a valid image file (JPEG, PNG, GIF) or PDF");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    const signedAtIso = new Date().toISOString();

    setFormData((prev) => {
      const newDecl = {
        ...(prev.declaration || defaultDeclaration),
        signatureType: "uploaded" as const,
        signatureFile: file,
        signature: `Uploaded signature - ${file.name}`,
        signatureFileName: file.name,
        signedAt: prev.declaration?.signedAt || signedAtIso,
      };

      return {
        ...prev,
        declaration: newDecl,
        signature: newDecl.signature,
        signatureType: newDecl.signatureType,
        signatureFileName: newDecl.signatureFileName,
        signed: true,
        signedAt: newDecl.signedAt,
      };
    });

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const url = ev.target?.result as string;
        setSignaturePreview(url);
        setFormData((prev) => ({
          ...prev,
          declaration: {
            ...(prev.declaration || defaultDeclaration),
            signatureDataUrl: url,
          },
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setSignaturePreview("");
    }
  };

  const removeUploadedSignature = () => {
    setFormData((prev) => ({
      ...prev,
      declaration: {
        ...(prev.declaration || defaultDeclaration),
        signatureType: null,
        signatureFile: null,
        signature: "",
        signatureFileName: "",
        signatureDataUrl: "",
        signedAt: "",
      },
      signature: "",
      signatureType: null,
      signatureFileName: "",
      signed: false,
      signedAt: "",
    }));
    setSignaturePreview("");
    setSignatureMethod(null);

    const fileInput = document.getElementById(
      "signatureUpload"
    ) as HTMLInputElement | null;
    if (fileInput) fileInput.value = "";
  };

  const resetSignature = () => {
    clearSignature();
  };

  // ------------- FINAL SUBMIT -------------
  async function handleSubmit() {
    // ensure backend also sees top-level signature fields
    const payload = {
      ...formData,
      signature: formData.signature,
      signatureType: formData.signatureType,
      signatureFileName: formData.signatureFileName,
      signed: formData.signed,
      signedAt: formData.signedAt,
      completedByName:
        formData.completedByName || formData.declaration?.completedByName || "",
    };

    const res = await fetch("/api/company-incorporation/cayman/due-diligence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        onboardingId,
        jurisdiction: "CAYMAN",
        data: payload,
      }),
    });

    if (!res.ok) {
      alert("Failed to save. Please try again.");
      return;
    }

    router.push(
      `/company-incorporation/cayman/beneficial-ownership?onboardingId=${onboardingId}&jurisdiction=cayman`
    );
  }

  // ------------- RENDER (BVI-STYLE LAYOUT) -------------
  return (
    <div className="min-h-screen bg-[#020817] text-white">
      <div className="max-w-4xl mx-auto py-10 px-6 space-y-8">
        {/* Header */}
        <header>
          <h1 className="text-2xl font-bold">
            Cayman Islands – Due Diligence (Form 2)
          </h1>
          <p className="text-sm text-white/70">
            Please complete the due diligence details for the relevant
            individuals and source of funds.
          </p>
        </header>

        {/* Main Card (matches BVI outer card) */}
        <div className="border border-white/10 bg-[#0B1221] rounded-xl p-6 shadow-lg space-y-8">
          {/* Progress */}
          <div className="space-y-2">
            <Progress
              value={progress}
              className="h-2 bg-white/10 [&>div]:bg-blue-600"
            />
            <div className="flex justify-between text-xs text-white/60">
              <span>
                Step {currentStep + 1} of {FORM_STEPS.length}
              </span>
              <span>{FORM_STEPS[currentStep].title}</span>
            </div>
          </div>

          {/* Step Pills */}
          <div className="flex flex-wrap gap-2">
            {FORM_STEPS.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentStep(idx)}
                className={`px-3 py-1 rounded-full text-xs border ${
                  idx === currentStep
                    ? "bg-blue-600 border-blue-400 text-white"
                    : idx < currentStep
                    ? "bg-green-500/20 border-green-400/40 text-green-300"
                    : "bg-white/5 border-white/10 text-white/60"
                }`}
              >
                {s.title}
              </button>
            ))}
          </div>

          {/* Step Content */}
          <div className="space-y-6">
            {/* STEP 1 – Due Diligence Info */}
            {currentStepId === "dd" && (
              <section className="space-y-6">
                <h2 className="text-lg font-semibold">
                  1. Due Diligence Information
                </h2>
                <p className="text-sm text-white/60">
                  Provide details of individuals related to the entity,
                  including PEP status and any convictions.
                </p>

                {/* Individuals List */}
                {formData.individuals.map((p, idx) => (
                  <div
                    key={idx}
                    className="border border-white/10 bg-[#020617] rounded-lg p-4 space-y-3"
                  >
                    <h3 className="text-sm font-semibold">Person {idx + 1}</h3>

                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input
                        value={p.fullName}
                        onChange={(e) =>
                          updateIndividual(idx, { fullName: e.target.value })
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nationality</Label>
                        <Input
                          value={p.nationality}
                          onChange={(e) =>
                            updateIndividual(idx, {
                              nationality: e.target.value,
                            })
                          }
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Date of Birth</Label>
                        <Input
                          type="date"
                          value={p.dateOfBirth}
                          onChange={(e) =>
                            updateIndividual(idx, {
                              dateOfBirth: e.target.value,
                            })
                          }
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Residential Address</Label>
                      <Textarea
                        value={p.address}
                        onChange={(e) =>
                          updateIndividual(idx, { address: e.target.value })
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>ID / Passport Number</Label>
                        <Input
                          value={p.idNumber}
                          onChange={(e) =>
                            updateIndividual(idx, {
                              idNumber: e.target.value,
                            })
                          }
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>ID Expiry Date</Label>
                        <Input
                          type="date"
                          value={p.idExpiry}
                          onChange={(e) =>
                            updateIndividual(idx, {
                              idExpiry: e.target.value,
                            })
                          }
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Occupation</Label>
                      <Input
                        value={p.occupation}
                        onChange={(e) =>
                          updateIndividual(idx, {
                            occupation: e.target.value,
                          })
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>PEP Status</Label>
                      <div className="flex items-center gap-4 text-sm">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            checked={p.pep === true}
                            onChange={() =>
                              updateIndividual(idx, { pep: true })
                            }
                          />
                          <span>PEP</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            checked={p.pep === false}
                            onChange={() =>
                              updateIndividual(idx, { pep: false })
                            }
                          />
                          <span>Not PEP</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  onClick={addIndividual}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Add Individual
                </Button>

                {/* PEP Details */}
                <div className="border border-white/10 bg-[#020617] rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-semibold">
                    Politically Exposed Persons (PEP) – Additional Details
                  </h3>
                  <div className="space-y-2">
                    <Label>Are any individuals PEPs?</Label>
                    <div className="flex gap-4 text-sm">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={formData.pepDetails.isPEP === "yes"}
                          onChange={() => updatePepDetails({ isPEP: "yes" })}
                        />
                        <span>Yes</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={formData.pepDetails.isPEP === "no"}
                          onChange={() => updatePepDetails({ isPEP: "no" })}
                        />
                        <span>No</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Explanation / Details</Label>
                    <Textarea
                      value={formData.pepDetails.explanation}
                      onChange={(e) =>
                        updatePepDetails({ explanation: e.target.value })
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Convictions */}
                <div className="border border-white/10 bg-[#020617] rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-semibold">
                    Convictions / Regulatory Issues
                  </h3>
                  <div className="space-y-2">
                    <Label>
                      Have any individuals been convicted of a criminal offence
                      or been subject to regulatory sanctions?
                    </Label>
                    <div className="flex gap-4 text-sm">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={formData.convictions.hasConviction === "yes"}
                          onChange={() =>
                            updateConvictions({ hasConviction: "yes" })
                          }
                        />
                        <span>Yes</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={formData.convictions.hasConviction === "no"}
                          onChange={() =>
                            updateConvictions({ hasConviction: "no" })
                          }
                        />
                        <span>No</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Details</Label>
                    <Textarea
                      value={formData.convictions.details}
                      onChange={(e) =>
                        updateConvictions({ details: e.target.value })
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>
              </section>
            )}

            {/* STEP 2 – Source of Funds */}
            {currentStepId === "sof" && (
              <section className="space-y-6">
                <h2 className="text-lg font-semibold">2. Source of Funds</h2>
                <p className="text-sm text-white/60">
                  Select all applicable sources and provide additional details.
                </p>

                {/* Selection */}
                <div className="bg-[#020617] border border-white/10 rounded-lg p-4 space-y-2">
                  {[
                    "familyFortune",
                    "activeEntrepreneurial",
                    "formerEntrepreneurial",
                    "income",
                    "other",
                  ].map((item) => (
                    <label
                      key={item}
                      className="flex items-center gap-3 text-sm cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.sourceOfFunds.selected.includes(item)}
                        onChange={(e) => {
                          const selected = new Set(
                            formData.sourceOfFunds.selected
                          );
                          if (e.target.checked) selected.add(item);
                          else selected.delete(item);
                          updateSof({ selected: Array.from(selected) });
                        }}
                      />
                      <span className="capitalize">
                        {item === "familyFortune"
                          ? "Family Fortune"
                          : item === "activeEntrepreneurial"
                          ? "Active Entrepreneurial"
                          : item === "formerEntrepreneurial"
                          ? "Former Entrepreneurial"
                          : item === "income"
                          ? "Income"
                          : "Other"}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Details Cards (inner dark cards like BVI) */}
                {formData.sourceOfFunds.selected.includes("familyFortune") && (
                  <div className="bg-[#0F172A] p-4 rounded-lg border border-white/10 space-y-3">
                    <h3 className="text-sm font-semibold">Family Fortune</h3>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={
                          formData.sourceOfFunds.details.familyFortune
                            ?.description || ""
                        }
                        onChange={(e) =>
                          updateSofDetail(
                            "familyFortune",
                            "description",
                            e.target.value
                          )
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Approximate Net Worth</Label>
                      <Input
                        value={
                          formData.sourceOfFunds.details.familyFortune
                            ?.netWorth || ""
                        }
                        onChange={(e) =>
                          updateSofDetail(
                            "familyFortune",
                            "netWorth",
                            e.target.value
                          )
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  </div>
                )}

                {formData.sourceOfFunds.selected.includes(
                  "activeEntrepreneurial"
                ) && (
                  <div className="bg-[#0F172A] p-4 rounded-lg border border-white/10 space-y-3">
                    <h3 className="text-sm font-semibold">
                      Active Entrepreneurial
                    </h3>
                    <div className="space-y-2">
                      <Label>Company Name</Label>
                      <Input
                        value={
                          formData.sourceOfFunds.details.activeEntrepreneurial
                            ?.companyName || ""
                        }
                        onChange={(e) =>
                          updateSofDetail(
                            "activeEntrepreneurial",
                            "companyName",
                            e.target.value
                          )
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Business Description</Label>
                      <Textarea
                        value={
                          formData.sourceOfFunds.details.activeEntrepreneurial
                            ?.businessDescription || ""
                        }
                        onChange={(e) =>
                          updateSofDetail(
                            "activeEntrepreneurial",
                            "businessDescription",
                            e.target.value
                          )
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Textarea
                        value={
                          formData.sourceOfFunds.details.activeEntrepreneurial
                            ?.address || ""
                        }
                        onChange={(e) =>
                          updateSofDetail(
                            "activeEntrepreneurial",
                            "address",
                            e.target.value
                          )
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Website (optional)</Label>
                      <Input
                        value={
                          formData.sourceOfFunds.details.activeEntrepreneurial
                            ?.website || ""
                        }
                        onChange={(e) =>
                          updateSofDetail(
                            "activeEntrepreneurial",
                            "website",
                            e.target.value
                          )
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Net Worth</Label>
                      <Input
                        value={
                          formData.sourceOfFunds.details.activeEntrepreneurial
                            ?.netWorth || ""
                        }
                        onChange={(e) =>
                          updateSofDetail(
                            "activeEntrepreneurial",
                            "netWorth",
                            e.target.value
                          )
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  </div>
                )}

                {formData.sourceOfFunds.selected.includes(
                  "formerEntrepreneurial"
                ) && (
                  <div className="bg-[#0F172A] p-4 rounded-lg border border-white/10 space-y-3">
                    <h3 className="text-sm font-semibold">
                      Former Entrepreneurial
                    </h3>
                    <div className="space-y-2">
                      <Label>Company Name</Label>
                      <Input
                        value={
                          formData.sourceOfFunds.details.formerEntrepreneurial
                            ?.companyName || ""
                        }
                        onChange={(e) =>
                          updateSofDetail(
                            "formerEntrepreneurial",
                            "companyName",
                            e.target.value
                          )
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Sale Details</Label>
                      <Textarea
                        value={
                          formData.sourceOfFunds.details.formerEntrepreneurial
                            ?.saleDetails || ""
                        }
                        onChange={(e) =>
                          updateSofDetail(
                            "formerEntrepreneurial",
                            "saleDetails",
                            e.target.value
                          )
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Net Worth</Label>
                      <Input
                        value={
                          formData.sourceOfFunds.details.formerEntrepreneurial
                            ?.netWorth || ""
                        }
                        onChange={(e) =>
                          updateSofDetail(
                            "formerEntrepreneurial",
                            "netWorth",
                            e.target.value
                          )
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  </div>
                )}

                {formData.sourceOfFunds.selected.includes("income") && (
                  <div className="bg-[#0F172A] p-4 rounded-lg border border-white/10 space-y-3">
                    <h3 className="text-sm font-semibold">Income</h3>
                    <div className="space-y-2">
                      <Label>Employer</Label>
                      <Input
                        value={
                          formData.sourceOfFunds.details.income?.employer || ""
                        }
                        onChange={(e) =>
                          updateSofDetail("income", "employer", e.target.value)
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Salary Range</Label>
                      <Input
                        value={
                          formData.sourceOfFunds.details.income?.salaryRange ||
                          ""
                        }
                        onChange={(e) =>
                          updateSofDetail(
                            "income",
                            "salaryRange",
                            e.target.value
                          )
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Other Income</Label>
                      <Textarea
                        value={
                          formData.sourceOfFunds.details.income?.otherIncome ||
                          ""
                        }
                        onChange={(e) =>
                          updateSofDetail(
                            "income",
                            "otherIncome",
                            e.target.value
                          )
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  </div>
                )}

                {formData.sourceOfFunds.selected.includes("other") && (
                  <div className="bg-[#0F172A] p-4 rounded-lg border border-white/10 space-y-3">
                    <h3 className="text-sm font-semibold">Other Source</h3>
                    <div className="space-y-2">
                      <Label>Explanation</Label>
                      <Textarea
                        value={
                          formData.sourceOfFunds.details.other?.explanation ||
                          ""
                        }
                        onChange={(e) =>
                          updateSofDetail(
                            "other",
                            "explanation",
                            e.target.value
                          )
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* STEP 3 – Review & BVI-Style Signature */}
            {currentStepId === "review" && (
              <section className="space-y-8">
                <h2 className="text-lg font-semibold">3. Review & Submit</h2>
                <p className="text-sm text-white/60">
                  Review the key information below and sign the declaration to
                  confirm accuracy.
                </p>

                {/* Review – Individuals summary */}
                <div className="border border-white/10 bg-[#020617] rounded-lg p-4 space-y-4">
                  <h3 className="font-semibold text-base">Individuals</h3>
                  {formData.individuals.length === 0 ? (
                    <p className="text-white/60 text-sm">
                      No individuals added.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {formData.individuals.map((p, i) => (
                        <div
                          key={i}
                          className="border border-white/10 rounded-md p-3 bg-[#020817]"
                        >
                          <div className="font-medium">
                            {p.fullName || "Unnamed person"}
                          </div>
                          <div className="text-white/60">
                            {p.nationality || "—"} · {p.dateOfBirth || "No DOB"}
                          </div>
                          <div className="text-xs text-white/60 mt-1">
                            ID: {p.idNumber || "—"} (exp {p.idExpiry || "—"})
                          </div>
                          <div className="text-xs mt-1">
                            PEP: {p.pep ? "Yes" : "No"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Review – Source of Funds summary */}
                <div className="border border-white/10 bg-[#020617] rounded-lg p-4 space-y-3 text-sm">
                  <h3 className="font-semibold text-base">Source of Funds</h3>
                  {formData.sourceOfFunds.selected.length === 0 ? (
                    <p className="text-white/60">
                      No source of funds information selected.
                    </p>
                  ) : (
                    <ul className="list-disc list-inside space-y-1">
                      {formData.sourceOfFunds.selected.map((s) => (
                        <li key={s} className="capitalize">
                          {s === "familyFortune"
                            ? "Family Fortune"
                            : s === "activeEntrepreneurial"
                            ? "Active Entrepreneurial"
                            : s === "formerEntrepreneurial"
                            ? "Former Entrepreneurial"
                            : s === "income"
                            ? "Income"
                            : "Other"}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* BVI-Style Declaration + Signature Block */}
                <div className="space-y-6 border border-white/10 rounded-lg p-6 bg-[#020617]">
                  <h3 className="text-lg font-semibold">Declaration</h3>

                  <p className="text-sm text-white/70 leading-relaxed">
                    I/We declare and affirm that the information provided herein
                    is true and correct to the best of my/our knowledge and that
                    the assets to be introduced do not derive from any criminal,
                    illegal, money-laundering, terrorist, sanctions busting or
                    other nefarious activities. I/We are aware that
                    anti-money-laundering legislation applies and that I am/We
                    are bound by the statements given herein. I/We confirm that,
                    if requested to do so, I/We will provide any further
                    evidence as may be required in relation to the verification
                    of the identity or activities of the relevant individuals
                    and will promptly inform Silverside of any changes.
                  </p>

                  {/* Completed By Name */}
                  <div className="space-y-2">
                    <Label>Completed By (Full Name) *</Label>
                    <Input
                      className="bg-[#0F172A] text-white border-white/10"
                      value={
                        formData.declaration?.completedByName ||
                        formData.completedByName ||
                        ""
                      }
                      onChange={(e) =>
                        handleDeclarationChange(
                          "completedByName",
                          e.target.value
                        )
                      }
                      placeholder="Enter your full legal name"
                      required
                    />
                  </div>

                  {/* Signature Method & UI */}
                  <div className="space-y-4">
                    <Label className="font-medium">Signature Method *</Label>

                    {/* Choose method */}
                    {!formData.declaration?.signatureType &&
                      signatureMethod === null && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <button
                            type="button"
                            onClick={() => setSignatureMethod("draw")}
                            className="border-2 border-dashed border-white/20 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-500/10 transition-colors text-center"
                          >
                            <span className="font-medium">Draw Signature</span>
                            <p className="text-sm text-white/60">
                              Use your mouse to draw your signature
                            </p>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSignatureMethod("upload")}
                            className="border-2 border-dashed border-white/20 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-500/10 transition-colors text-center"
                          >
                            <span className="font-medium">
                              Upload Signature
                            </span>
                            <p className="text-sm text-white/60">
                              Upload an image or PDF of your signature
                            </p>
                          </button>
                        </div>
                      )}

                    {/* Draw signature */}
                    {signatureMethod === "draw" &&
                      !formData.declaration?.signatureType && (
                        <div className="border border-white/20 rounded-lg p-4 space-y-4 bg-[#020817]">
                          <div className="flex justify-between items-center">
                            <Label>Draw your signature below</Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={clearSignature}
                              className="border-white/40 text-white hover:bg-white/10"
                            >
                              Clear
                            </Button>
                          </div>

                          <div className="border-2 border-dashed border-white/30 rounded-lg bg-white">
                            <canvas
                              ref={setCanvasRef}
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
                              className="border-white/40 text-white hover:bg-white/10"
                            >
                              Back
                            </Button>
                            <Button
                              type="button"
                              onClick={saveDrawnSignature}
                              disabled={
                                !signaturePreview || isSignatureUploading
                              }
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              {isSignatureUploading
                                ? "Saving…"
                                : "Save Signature"}
                            </Button>
                          </div>

                          {error && (
                            <p className="text-xs text-red-400">{error}</p>
                          )}
                        </div>
                      )}

                    {/* Upload signature */}
                    {signatureMethod === "upload" &&
                      !formData.declaration?.signatureType && (
                        <div className="border border-white/20 rounded-lg p-4 space-y-4 bg-[#020817]">
                          <Label>Upload your signature file</Label>

                          <div className="border-2 border-dashed border-white/30 rounded-lg p-6 text-center">
                            <input
                              id="signatureUpload"
                              type="file"
                              accept=".jpg,.jpeg,.png,.gif,.pdf"
                              onChange={handleFileUpload}
                              className="hidden"
                            />
                            <label
                              htmlFor="signatureUpload"
                              className="cursor-pointer block"
                            >
                              <p className="text-sm text-blue-400 font-medium">
                                Click to upload
                              </p>
                              <p className="text-xs text-white/60">
                                PNG, JPG, GIF, PDF up to 5MB
                              </p>
                            </label>
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setSignatureMethod(null)}
                            className="border-white/40 text-white hover:bg-white/10"
                          >
                            Back
                          </Button>

                          {error && (
                            <p className="text-xs text-red-400">{error}</p>
                          )}
                        </div>
                      )}

                    {/* Signature Preview */}
                    {(formData.declaration?.signatureType === "drawn" ||
                      formData.declaration?.signatureType === "uploaded") && (
                      <div className="border border-white/20 rounded-lg p-4 space-y-4 bg-[#020817]">
                        <div className="flex justify-between items-center">
                          <Label>
                            {formData.declaration.signatureType === "drawn"
                              ? "Drawn Signature"
                              : "Uploaded Signature"}
                          </Label>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={resetSignature}
                            className="border-white/40 text-white hover:bg-white/10"
                          >
                            Change Signature
                          </Button>
                        </div>

                        {signaturePreview && (
                          <div className="bg-white border rounded-lg p-4 flex justify-center">
                            <img
                              src={signaturePreview}
                              alt="Signature preview"
                              className="max-w-full max-h-32"
                            />
                          </div>
                        )}

                        {!signaturePreview &&
                          formData.declaration.signatureType === "uploaded" && (
                            <p className="text-xs text-white/60">
                              Signature file uploaded:{" "}
                              {formData.declaration.signatureFileName ||
                                "File saved"}
                            </p>
                          )}

                        <p className="text-xs text-green-400">
                          ✓ Signature saved successfully
                        </p>
                      </div>
                    )}

                    {/* Verification Info */}
                    {formData.declaration?.signatureType && (
                      <div className="bg-emerald-900/40 border border-emerald-500/50 p-3 rounded-lg text-xs space-y-1 text-emerald-100">
                        <p>
                          ✓ Signature Type: {formData.declaration.signatureType}
                        </p>
                        <p>
                          Signed At:{" "}
                          {formData.declaration.signedAt
                            ? new Date(
                                formData.declaration.signedAt
                              ).toLocaleString()
                            : "—"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {error && !signatureMethod && (
                  <p className="text-xs text-red-400">{error}</p>
                )}
              </section>
            )}
          </div>

          {/* Nav Buttons */}
          <div className="flex justify-between pt-4 border-t border-white/10">
            <Button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 0}
              variant="outline"
              className="border-white/40 text-white hover:bg-white/10 disabled:opacity-40"
            >
              Previous
            </Button>

            {currentStep < FORM_STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={nextStep}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Next
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Save & Continue to Form 3
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
