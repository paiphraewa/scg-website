"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export interface CaymanEntityInstructionData {
  companyNames: {
    isExistingEntity: boolean;
    firstName: string;
    secondName: string;
    currentName: string;
  };

  entityType?: string;

  transferInDetails?: {
    contactName: string;
    contactEmail: string;
    reason: string;
    isCimaRegistered: boolean;
    cimaNumber?: string;
    cimaDate?: string;
    goodStandingStatus?: string;
  };

  businessActivity?: {
    proposedActivities: string;
    rocNatureOfBusiness: string;
    financialYearEnd: string;
    sourceOfFunds: string;
    fundSourceLocation: string;

    investment?: {
      investmentType: string;
      investmentLocation: string;
      investorType: string;
      investorLocation: string;
      fundSize: string;
      fundStrategy: string;
      administrator: string;
      investmentManager: string;
      auditor: string;
      counsel: string;
      taxAdvisor: string;
    };
  };

  capitalStructure?: {
    useDefault: boolean;
    customStructure?: string;
  };

  shareholders: Array<{
    name: string;
    shares: string;
    address: string;
  }>;

  ubos: Array<{
    name: string;
    address: string;
  }>;

  directors: Array<{
    positionType: string;
    name: string;
    addressType: string;
    address: string;
  }>;

  officers?: Array<{
    positionType: string;
    name: string;
    addressType: string;
    address: string;
    officeHeld?: string;
    contributionInterest?: string;
  }>;

  contactDetails?: {
    contactName: string;
    contactEmail: string;
    contactPhone: string;
  };

  serviceRequest?: {
    notes: string;
  };

  // Signature-related (flat, not in a declaration object)
  signatureType?: "drawn" | "uploaded" | null;
  signatureFileName?: string;
  signatureFilePath?: string;
  signatureDataUrl?: string;
  signedAt?: string;
  completedByName?: string;
  signature?: string;
  signed?: boolean;

  // Optional local-only file holder (will stringify as {} in JSON)
  signatureFile?: File | null;
}

interface CaymanEntityInstructionFormProps {
  onboardingId: string;
  jurisdiction: string;
  initialData: CaymanEntityInstructionData;
}

// Small helper for the review section (same as BVI)
function SummaryRow({
  label,
  value,
}: {
  label: string;
  value?: string | number | boolean;
}) {
  return (
    <div className="text-sm">
      <span className="text-muted-foreground">{label}:</span>{" "}
      <span className="font-medium">
        {value ?? value === 0 ? String(value) : "—"}
      </span>
    </div>
  );
}

// Helper to upload drawn signature (same as BVI)
async function uploadSignatureFile(onboardingId: string, file: File) {
  const fd = new FormData();
  fd.append("file", file, file.name);
  fd.append("documentType", "signature");
  fd.append("onboardingId", onboardingId);

  const uploadRes = await fetch("/api/upload", {
    method: "POST",
    credentials: "include",
    body: fd,
  });

  const json = await uploadRes.json().catch(() => ({}));
  if (!uploadRes.ok) {
    throw new Error(json?.error || "Failed to upload signature");
  }

  return (json.filePath as string) || "";
}

// ----------------------------------------------------
// STEP CONFIG
// ----------------------------------------------------
const FORM_STEPS = [
  { id: "entity-info", title: "Entity Information" },
  { id: "business", title: "Business Activity" },
  { id: "capital", title: "Capital Structure" },
  { id: "shareholders", title: "Members / Shareholders" },
  { id: "ubos", title: "Ultimate Beneficial Owners" },
  { id: "directors", title: "Directors / Officers" },
  { id: "contact", title: "Contact Details" },
  { id: "service", title: "Service Request" },
  { id: "review", title: "Review & Sign" },
];

// Simple entity types list
const entityTypes = [
  "Exempted Company",
  "Exempted Limited Partnership (ELP)",
  "Exempted Foundation Company",
  "Foreign Company",
  "Limited Liability Company (LLC)",
  "Ordinary Resident Company",
  "Resident Foundation Company",
  "Segregated Portfolio Company (SPC)",
  "Special Economic Zone Company (SEZC)",
  "Other",
];

export default function CaymanEntityInstructionForm({
  onboardingId,
  jurisdiction,
  initialData,
}: CaymanEntityInstructionFormProps) {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(0);
  const progress = ((currentStep + 1) / FORM_STEPS.length) * 100;

  function nextStep() {
    if (currentStep < FORM_STEPS.length - 1) setCurrentStep((s) => s + 1);
  }

  function prevStep() {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }

  function goToStep(i: number) {
    if (i >= 0 && i < FORM_STEPS.length) setCurrentStep(i);
  }

  // ----------------------------------------------------
  // STATE
  // ----------------------------------------------------
  const [formData, setFormData] = useState<CaymanEntityInstructionData>({
    companyNames: initialData.companyNames || {
      isExistingEntity: false,
      firstName: "",
      secondName: "",
      currentName: "",
    },
    entityType: initialData.entityType || "",
    transferInDetails: initialData.transferInDetails || {
      contactName: "",
      contactEmail: "",
      reason: "",
      isCimaRegistered: false,
      cimaNumber: "",
      cimaDate: "",
      goodStandingStatus: "",
    },
    businessActivity: initialData.businessActivity,
    capitalStructure: initialData.capitalStructure || {
      useDefault: true,
      customStructure: "",
    },
    shareholders: initialData.shareholders || [],
    ubos: initialData.ubos || [],
    directors: initialData.directors || [],
    officers: initialData.officers || [],
    contactDetails: initialData.contactDetails || {
      contactName: "",
      contactEmail: "",
      contactPhone: "",
    },
    serviceRequest: initialData.serviceRequest || {
      notes: "",
    },
    signature: initialData.signature || "",
    signatureType: initialData.signatureType ?? null,
    signatureFileName: initialData.signatureFileName || "",
    signatureFilePath: initialData.signatureFilePath || "",
    signatureDataUrl: initialData.signatureDataUrl || "",
    completedByName: initialData.completedByName || "",
    signedAt: initialData.signedAt || "",
    signed: initialData.signed ?? false,
    signatureFile: null,
  });

  // Signature UI state (same style as BVI)
  const [signatureMethod, setSignatureMethod] = useState<
    "draw" | "upload" | null
  >(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string>("");
  const [isSignatureUploading, setIsSignatureUploading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ----------------------------------------------------
  // AUTOSAVE (PRODUCTION ONLY)
  // ----------------------------------------------------
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!onboardingId) return;

    const timeout = setTimeout(() => {
      fetch("/api/company-incorporation/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onboardingId,
          jurisdiction: "CAYMAN",
          caymanEntityInstruction: formData,
        }),
      });
    }, 700);

    return () => clearTimeout(timeout);
  }, [formData, onboardingId]);

  // ----------------------------------------------------
  // UPDATE HELPERS
  // ----------------------------------------------------
  function updateCompanyNames(
    partial: Partial<CaymanEntityInstructionData["companyNames"]>
  ) {
    setFormData((prev) => ({
      ...prev,
      companyNames: { ...prev.companyNames, ...partial },
    }));
  }

  function updateTransferInDetails(
    partial: Partial<
      NonNullable<CaymanEntityInstructionData["transferInDetails"]>
    >
  ) {
    setFormData((prev) => ({
      ...prev,
      transferInDetails: {
        ...(prev.transferInDetails || {
          contactName: "",
          contactEmail: "",
          reason: "",
          isCimaRegistered: false,
          cimaNumber: "",
          cimaDate: "",
          goodStandingStatus: "",
        }),
        ...partial,
      },
    }));
  }

  function updateBusinessActivity(
    partial: Partial<
      NonNullable<CaymanEntityInstructionData["businessActivity"]>
    >
  ) {
    setFormData((prev) => {
      const base: CaymanEntityInstructionData["businessActivity"] = {
        proposedActivities: prev.businessActivity?.proposedActivities || "",
        rocNatureOfBusiness: prev.businessActivity?.rocNatureOfBusiness || "",
        financialYearEnd: prev.businessActivity?.financialYearEnd || "",
        sourceOfFunds: prev.businessActivity?.sourceOfFunds || "",
        fundSourceLocation: prev.businessActivity?.fundSourceLocation || "",
        investment: {
          investmentType:
            prev.businessActivity?.investment?.investmentType || "",
          investmentLocation:
            prev.businessActivity?.investment?.investmentLocation || "",
          investorType: prev.businessActivity?.investment?.investorType || "",
          investorLocation:
            prev.businessActivity?.investment?.investorLocation || "",
          fundSize: prev.businessActivity?.investment?.fundSize || "",
          fundStrategy: prev.businessActivity?.investment?.fundStrategy || "",
          administrator: prev.businessActivity?.investment?.administrator || "",
          investmentManager:
            prev.businessActivity?.investment?.investmentManager || "",
          auditor: prev.businessActivity?.investment?.auditor || "",
          counsel: prev.businessActivity?.investment?.counsel || "",
          taxAdvisor: prev.businessActivity?.investment?.taxAdvisor || "",
        },
      };

      return {
        ...prev,
        businessActivity: {
          ...base,
          ...partial,
        },
      };
    });
  }

  function updateInvestmentDetails(
    partial: Partial<
      NonNullable<CaymanEntityInstructionData["businessActivity"]>["investment"]
    >
  ) {
    setFormData((prev) => {
      const currentBA = prev.businessActivity || {
        proposedActivities: "",
        rocNatureOfBusiness: "",
        financialYearEnd: "",
        sourceOfFunds: "",
        fundSourceLocation: "",
      };

      const invBase = currentBA.investment || {
        investmentType: "",
        investmentLocation: "",
        investorType: "",
        investorLocation: "",
        fundSize: "",
        fundStrategy: "",
        administrator: "",
        investmentManager: "",
        auditor: "",
        counsel: "",
        taxAdvisor: "",
      };

      return {
        ...prev,
        businessActivity: {
          ...currentBA,
          investment: {
            ...invBase,
            ...partial,
          },
        },
      };
    });
  }

  function updateCapitalStructure(
    partial: Partial<
      NonNullable<CaymanEntityInstructionData["capitalStructure"]>
    >
  ) {
    setFormData((prev) => ({
      ...prev,
      capitalStructure: {
        ...(prev.capitalStructure || {
          useDefault: true,
          customStructure: "",
        }),
        ...partial,
      },
    }));
  }

  function addShareholder() {
    setFormData((prev) => ({
      ...prev,
      shareholders: [
        ...(prev.shareholders || []),
        { name: "", shares: "", address: "" },
      ],
    }));
  }

  function updateShareholder(
    index: number,
    partial: Partial<CaymanEntityInstructionData["shareholders"][number]>
  ) {
    setFormData((prev) => {
      const updated = [...(prev.shareholders || [])];
      updated[index] = { ...updated[index], ...partial };
      return { ...prev, shareholders: updated };
    });
  }

  function removeShareholder(index: number) {
    setFormData((prev) => {
      const updated = [...(prev.shareholders || [])];
      updated.splice(index, 1);
      return { ...prev, shareholders: updated };
    });
  }

  function addUbo() {
    setFormData((prev) => ({
      ...prev,
      ubos: [...(prev.ubos || []), { name: "", address: "" }],
    }));
  }

  function updateUbo(
    index: number,
    partial: Partial<CaymanEntityInstructionData["ubos"][number]>
  ) {
    setFormData((prev) => {
      const updated = [...(prev.ubos || [])];
      updated[index] = { ...updated[index], ...partial };
      return { ...prev, ubos: updated };
    });
  }

  function removeUbo(index: number) {
    setFormData((prev) => {
      const updated = [...(prev.ubos || [])];
      updated.splice(index, 1);
      return { ...prev, ubos: updated };
    });
  }

  function addDirector() {
    setFormData((prev) => ({
      ...prev,
      directors: [
        ...(prev.directors || []),
        {
          positionType: "",
          name: "",
          addressType: "Business",
          address: "",
        },
      ],
    }));
  }

  function updateDirector(
    index: number,
    partial: Partial<CaymanEntityInstructionData["directors"][number]>
  ) {
    setFormData((prev) => {
      const updated = [...(prev.directors || [])];
      updated[index] = { ...updated[index], ...partial };
      return { ...prev, directors: updated };
    });
  }

  function removeDirector(index: number) {
    setFormData((prev) => {
      const updated = [...(prev.directors || [])];
      updated.splice(index, 1);
      return { ...prev, directors: updated };
    });
  }

  function addOfficer() {
    setFormData((prev) => ({
      ...prev,
      officers: [
        ...(prev.officers || []),
        {
          positionType: "",
          name: "",
          addressType: "Business",
          address: "",
          officeHeld: "",
          contributionInterest: "",
        },
      ],
    }));
  }

  function updateOfficer(
    index: number,
    partial: Partial<
      NonNullable<CaymanEntityInstructionData["officers"]>[number]
    >
  ) {
    setFormData((prev) => {
      const officers = prev.officers || [];
      const updated = [...officers];
      updated[index] = { ...updated[index], ...partial };
      return { ...prev, officers: updated };
    });
  }

  function removeOfficer(index: number) {
    setFormData((prev) => {
      const officers = prev.officers || [];
      const updated = [...officers];
      updated.splice(index, 1);
      return { ...prev, officers: updated };
    });
  }

  function updateContactDetails(
    partial: Partial<NonNullable<CaymanEntityInstructionData["contactDetails"]>>
  ) {
    setFormData((prev) => ({
      ...prev,
      contactDetails: {
        ...(prev.contactDetails || {
          contactName: "",
          contactEmail: "",
          contactPhone: "",
        }),
        ...partial,
      },
    }));
  }

  function updateServiceRequest(
    partial: Partial<NonNullable<CaymanEntityInstructionData["serviceRequest"]>>
  ) {
    setFormData((prev) => ({
      ...prev,
      serviceRequest: {
        ...(prev.serviceRequest || {
          notes: "",
        }),
        ...partial,
      },
    }));
  }

  // ----------------------------------------------------
  // SIGNATURE HANDLERS (BVI-style, adapted to Cayman fields)
  // ----------------------------------------------------
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
      signatureType: null,
      signature: "",
      signatureFileName: "",
      signatureFilePath: "",
      signatureDataUrl: "",
      signatureFile: null,
      signed: false,
    }));

    const fileInput = document.getElementById(
      "signatureUpload"
    ) as HTMLInputElement | null;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  async function saveDrawnSignature() {
    if (!canvasRef) return;

    if (!onboardingId) {
      setError("Missing onboardingId; cannot upload signature yet.");
      return;
    }

    setIsSignatureUploading(true);
    setError("");

    try {
      const blob: Blob | null = await new Promise((resolve) =>
        canvasRef.toBlob((b) => resolve(b), "image/png")
      );
      if (!blob) {
        setError("Could not read signature from canvas. Please draw again.");
        return;
      }

      const file = new File([blob], "signature.png", { type: "image/png" });

      const filePath = await uploadSignatureFile(onboardingId, file);

      if (!signaturePreview) {
        const reader = new FileReader();
        reader.onload = () => setSignaturePreview(String(reader.result || ""));
        reader.readAsDataURL(file);
      }

      setFormData((prev) => ({
        ...prev,
        signatureType: "drawn",
        signature: filePath,
        signatureFileName: "signature.png",
        signatureFilePath: filePath,
        signatureDataUrl: "",
        signedAt: prev.signedAt || new Date().toISOString(),
        signed: true,
      }));

      setSignatureMethod(null);
    } catch (err: any) {
      console.error("signature upload error:", err);
      setError(err?.message || "Failed to upload signature");
    } finally {
      setIsSignatureUploading(false);
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

    setFormData((prev) => ({
      ...prev,
      signatureType: "uploaded",
      signatureFile: file,
      signature: `Uploaded signature - ${file.name}`,
      signatureFileName: file.name,
      signedAt: prev.signedAt || new Date().toISOString(),
      signed: true,
    }));

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setSignaturePreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSignaturePreview("");
    }
  };

  const removeUploadedSignature = () => {
    setFormData((prev) => ({
      ...prev,
      signatureType: null,
      signatureFile: null,
      signature: "",
      signatureFileName: "",
      signatureFilePath: "",
      signatureDataUrl: "",
      signed: false,
    }));
    setSignaturePreview("");
    setSignatureMethod(null);

    const fileInput = document.getElementById(
      "signatureUpload"
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const resetSignature = () => {
    clearSignature();
  };

  // If we already have a saved signature path (e.g., draft) show it
  useEffect(() => {
    if (
      !signaturePreview &&
      formData.signatureType &&
      formData.signatureFilePath
    ) {
      setSignaturePreview(formData.signatureFilePath);
    }
  }, [signaturePreview, formData.signatureType, formData.signatureFilePath]);

  // ----------------------------------------------------
  // FINAL SUBMIT (only from Review step & with signature)
  // ----------------------------------------------------
  async function handleSubmit() {
    const reviewIndex = FORM_STEPS.findIndex((s) => s.id === "review");
    if (currentStep !== reviewIndex) {
      setError("Please go to the Review & Sign step before submitting.");
      return;
    }

    if (!formData.completedByName?.trim()) {
      setError('Please fill in "Completed By (Name)" before submitting.');
      return;
    }

    if (!formData.signatureType) {
      setError("Please provide your signature before submitting.");
      return;
    }

    setError("");

    const res = await fetch(
      "/api/company-incorporation/cayman/entity-instruction",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onboardingId,
          jurisdiction: "CAYMAN",
          data: formData,
        }),
      }
    );

    if (res.ok) {
      router.push(
        `/company-incorporation/cayman/due-diligence?onboardingId=${onboardingId}&jurisdiction=cayman`
      );
    } else {
      const text = await res.text().catch(() => "");
      setError(text || "Failed to submit form. Please try again.");
    }
  }

  const jurisdictionName =
    jurisdiction?.toLowerCase() === "cayman"
      ? "Cayman Islands"
      : jurisdiction || "Cayman Islands";

  // ----------------------------------------------------
  // RENDER (BVI-style Card + Header + Inner content)
  // ----------------------------------------------------
  return (
    <Card className="max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="!text-2xl !font-bold">
          Cayman Entity Instruction Form - {jurisdictionName}
        </CardTitle>
        <CardDescription>
          Provide the entity information and instructions for your Cayman
          structure.
        </CardDescription>

        {/* Progress Bar */}
        <div className="space-y-2 mt-4">
          <Progress value={progress} className="w-full" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              Step {currentStep + 1} of {FORM_STEPS.length}
            </span>
            <span>{FORM_STEPS[currentStep].title}</span>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex overflow-x-auto pb-2 gap-2 mt-2">
          {FORM_STEPS.map((step, index) => (
            <button
              key={step.id}
              type="button"
              onClick={() => goToStep(index)}
              className={`flex-shrink-0 px-3 py-1 text-sm rounded-full border ${
                index === currentStep
                  ? "bg-blue-600 text-white border-blue-600"
                  : index < currentStep
                  ? "bg-green-100 text-green-800 border-green-300"
                  : "bg-gray-100 text-gray-600 border-gray-300"
              }`}
            >
              {step.title}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-8">
          {error && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/15 text-green-600 text-sm p-3 rounded-md">
              {success}
            </div>
          )}

          {/* ----------------------------------------------------
             STEP 1 — ENTITY INFORMATION
          ---------------------------------------------------- */}
          {FORM_STEPS[currentStep].id === "entity-info" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">1. Entity Information</h3>

              {/* NEW vs EXISTING ENTITY */}
              <div className="space-y-2">
                <Label>Is this a new entity or an existing entity?</Label>
                <div className="flex gap-6 mt-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="entityOption"
                      value="new"
                      checked={!formData.companyNames.isExistingEntity}
                      onChange={() =>
                        updateCompanyNames({ isExistingEntity: false })
                      }
                    />
                    <span>New Entity</span>
                  </label>

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="entityOption"
                      value="existing"
                      checked={formData.companyNames.isExistingEntity}
                      onChange={() =>
                        updateCompanyNames({ isExistingEntity: true })
                      }
                    />
                    <span>Existing Entity (Transfer-In)</span>
                  </label>
                </div>
              </div>

              {/* NEW ENTITY FIELDS */}
              {!formData.companyNames.isExistingEntity && (
                <div className="space-y-4 border rounded-lg p-4 bg-background">
                  <div className="space-y-2">
                    <Label>First Proposed Name*</Label>
                    <Input
                      value={formData.companyNames.firstName}
                      onChange={(e) =>
                        updateCompanyNames({ firstName: e.target.value })
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Second proposed name*</Label>
                    <Input
                      value={formData.companyNames.secondName}
                      onChange={(e) =>
                        updateCompanyNames({ secondName: e.target.value })
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>
              )}

              {/* EXISTING ENTITY FIELDS */}
              {formData.companyNames.isExistingEntity && (
                <div className="space-y-4 border rounded-lg p-4 bg-background">
                  <div className="space-y-2">
                    <Label>Current registered name*</Label>
                    <Input
                      value={formData.companyNames.currentName}
                      onChange={(e) =>
                        updateCompanyNames({ currentName: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Contact person at current RO – Name</Label>
                    <Input
                      value={formData.transferInDetails?.contactName || ""}
                      onChange={(e) =>
                        updateTransferInDetails({
                          contactName: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Contact person at current RO – Email</Label>
                    <Input
                      type="email"
                      value={formData.transferInDetails?.contactEmail || ""}
                      onChange={(e) =>
                        updateTransferInDetails({
                          contactEmail: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Reason for change of RO</Label>
                    <Textarea
                      value={formData.transferInDetails?.reason || ""}
                      onChange={(e) =>
                        updateTransferInDetails({
                          reason: e.target.value,
                        })
                      }
                    />
                  </div>

                  {/* CIMA REGISTERED */}
                  <div className="space-y-2">
                    <Label>Is the entity CIMA registered?</Label>
                    <div className="flex gap-6 mt-1">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          value="yes"
                          checked={
                            formData.transferInDetails?.isCimaRegistered ===
                            true
                          }
                          onChange={() =>
                            updateTransferInDetails({
                              isCimaRegistered: true,
                            })
                          }
                        />
                        <span>Yes</span>
                      </label>

                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          value="no"
                          checked={
                            formData.transferInDetails?.isCimaRegistered ===
                            false
                          }
                          onChange={() =>
                            updateTransferInDetails({
                              isCimaRegistered: false,
                            })
                          }
                        />
                        <span>No</span>
                      </label>
                    </div>
                  </div>

                  {/* CIMA DETAILS */}
                  {formData.transferInDetails?.isCimaRegistered && (
                    <>
                      <div className="space-y-2">
                        <Label>CIMA Registration Number</Label>
                        <Input
                          value={formData.transferInDetails?.cimaNumber || ""}
                          onChange={(e) =>
                            updateTransferInDetails({
                              cimaNumber: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>CIMA Registration Date</Label>
                        <Input
                          type="date"
                          value={formData.transferInDetails?.cimaDate || ""}
                          onChange={(e) =>
                            updateTransferInDetails({
                              cimaDate: e.target.value,
                            })
                          }
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label>Good standing status</Label>
                    <Textarea
                      value={
                        formData.transferInDetails?.goodStandingStatus || ""
                      }
                      onChange={(e) =>
                        updateTransferInDetails({
                          goodStandingStatus: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              )}

              {/* ENTITY TYPE — ALWAYS SHOWN */}
              <div className="space-y-2">
                <Label>Type of entity</Label>
                <p className="text-xs text-muted-foreground">
                  Select the type of entity. Please choose one option.
                </p>

                <div className="space-y-2 border rounded-md p-3 bg-background">
                  {entityTypes.map((type) => (
                    <label
                      key={type}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <input
                        type="radio"
                        className="h-4 w-4"
                        checked={formData.entityType === type}
                        onChange={() =>
                          setFormData((prev) => ({
                            ...prev,
                            entityType: type,
                          }))
                        }
                      />
                      <span>{type}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — BUSINESS ACTIVITY */}
          {FORM_STEPS[currentStep].id === "business" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">2. Business Activity</h3>
              <p className="text-sm text-muted-foreground">
                Provide the proposed or existing business activity details for
                the entity.
              </p>

              {/* (a) Proposed / Existing Activities */}
              <div className="space-y-2">
                <Label>Detailed Proposed or Existing Business Activities</Label>
                <Textarea
                  placeholder="Describe in detail the business activities of the entity"
                  value={formData.businessActivity?.proposedActivities || ""}
                  onChange={(e) =>
                    updateBusinessActivity({
                      proposedActivities: e.target.value,
                    })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              {/* (b) ROC Nature of Business */}
              <div className="space-y-2">
                <Label>ROC Nature of Business</Label>
                <Input
                  placeholder="E.g. Investment Holding / Consultancy / Trading"
                  value={formData.businessActivity?.rocNatureOfBusiness || ""}
                  onChange={(e) =>
                    updateBusinessActivity({
                      rocNatureOfBusiness: e.target.value,
                    })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              {/* (c) Financial Year-End */}
              <div className="space-y-2">
                <Label>Financial Year-End</Label>
                <Input
                  placeholder="E.g. 31 December"
                  value={formData.businessActivity?.financialYearEnd || ""}
                  onChange={(e) =>
                    updateBusinessActivity({
                      financialYearEnd: e.target.value,
                    })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              {/* (d) Source of Funds + Locations */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Source of Funds for the Entity</Label>
                  <Textarea
                    placeholder="Describe the source of funds (e.g. capital contributions, investment proceeds)"
                    value={formData.businessActivity?.sourceOfFunds || ""}
                    onChange={(e) =>
                      updateBusinessActivity({
                        sourceOfFunds: e.target.value,
                      })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Location(s) of Fund Source</Label>
                  <Input
                    placeholder="E.g. Hong Kong, Singapore, UK"
                    value={formData.businessActivity?.fundSourceLocation || ""}
                    onChange={(e) =>
                      updateBusinessActivity({
                        fundSourceLocation: e.target.value,
                      })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>

              {/* (e) Investment Fund Details (Only for Investment Funds) */}
              <div className="space-y-4 border rounded-md p-4 bg-background">
                <h4 className="text-md font-medium">
                  Investment Fund Details (if applicable)
                </h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Complete this section only if the entity is an Investment
                  Fund.
                </p>

                <div className="space-y-2">
                  <Label>Type &amp; Location of Investment(s)</Label>
                  <Input
                    placeholder="E.g. Private Equity in US / Crypto Assets in Singapore"
                    value={
                      formData.businessActivity?.investment?.investmentType ||
                      ""
                    }
                    onChange={(e) =>
                      updateInvestmentDetails({
                        investmentType: e.target.value,
                      })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Type &amp; Location of Investors</Label>
                  <Input
                    placeholder="E.g. HNW Individuals in Hong Kong"
                    value={
                      formData.businessActivity?.investment?.investorType || ""
                    }
                    onChange={(e) =>
                      updateInvestmentDetails({ investorType: e.target.value })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fund Size</Label>
                  <Input
                    placeholder="E.g. USD 5 million"
                    value={
                      formData.businessActivity?.investment?.fundSize || ""
                    }
                    onChange={(e) =>
                      updateInvestmentDetails({ fundSize: e.target.value })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fund Strategy</Label>
                  <Textarea
                    placeholder="Describe the fund investment strategy"
                    value={
                      formData.businessActivity?.investment?.fundStrategy || ""
                    }
                    onChange={(e) =>
                      updateInvestmentDetails({
                        fundStrategy: e.target.value,
                      })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                {/* Service Providers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Administrator</Label>
                    <Input
                      placeholder="Administrator name"
                      value={
                        formData.businessActivity?.investment?.administrator ||
                        ""
                      }
                      onChange={(e) =>
                        updateInvestmentDetails({
                          administrator: e.target.value,
                        })
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Investment Manager</Label>
                    <Input
                      placeholder="Investment manager name"
                      value={
                        formData.businessActivity?.investment
                          ?.investmentManager || ""
                      }
                      onChange={(e) =>
                        updateInvestmentDetails({
                          investmentManager: e.target.value,
                        })
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Auditor</Label>
                    <Input
                      placeholder="Auditor name"
                      value={
                        formData.businessActivity?.investment?.auditor || ""
                      }
                      onChange={(e) =>
                        updateInvestmentDetails({ auditor: e.target.value })
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Onshore / Offshore Counsel</Label>
                    <Input
                      placeholder="Legal counsel"
                      value={
                        formData.businessActivity?.investment?.counsel || ""
                      }
                      onChange={(e) =>
                        updateInvestmentDetails({ counsel: e.target.value })
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Tax Advisor</Label>
                    <Input
                      placeholder="Tax advisor name"
                      value={
                        formData.businessActivity?.investment?.taxAdvisor || ""
                      }
                      onChange={(e) =>
                        updateInvestmentDetails({ taxAdvisor: e.target.value })
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 — CAPITAL STRUCTURE */}
          {FORM_STEPS[currentStep].id === "capital" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">3. Capital Structure</h3>

              {/* Use default capital structure */}
              <div className="space-y-2 border rounded-lg p-4 bg-background">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={formData.capitalStructure?.useDefault === true}
                    onChange={() =>
                      updateCapitalStructure({
                        useDefault: true,
                        customStructure: "",
                      })
                    }
                  />
                  <span>Use default capital structure</span>
                </label>

                <p className="text-xs text-muted-foreground">
                  Default: US$50,000 (comprising 50,000 ordinary voting shares
                  of US$1.00 par value each).
                </p>
              </div>

              {/* Custom capital structure */}
              <div className="space-y-2 border rounded-lg p-4 bg-background">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={formData.capitalStructure?.useDefault === false}
                    onChange={() =>
                      updateCapitalStructure({
                        useDefault: false,
                      })
                    }
                  />
                  <span>Specify other capital structure</span>
                </label>

                {!formData.capitalStructure?.useDefault && (
                  <Textarea
                    placeholder="Describe the capital structure (e.g. number of shares, classes, par value)"
                    value={formData.capitalStructure?.customStructure || ""}
                    onChange={(e) =>
                      updateCapitalStructure({
                        customStructure: e.target.value,
                      })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                )}
              </div>
            </div>
          )}

          {/* STEP 4 — MEMBERS / SHAREHOLDERS */}
          {FORM_STEPS[currentStep].id === "shareholders" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">
                4. Members / Shareholders
              </h3>

              <p className="text-sm text-muted-foreground">
                Please add each shareholder below. You may add multiple entries.
              </p>

              {formData.shareholders.length === 0 && (
                <p className="text-sm text-muted-foreground italic">
                  No shareholders added yet.
                </p>
              )}

              <div className="space-y-4">
                {formData.shareholders.map((sh, index) => (
                  <div
                    key={index}
                    className="border rounded-md p-4 space-y-4 bg-background"
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Shareholder #{index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeShareholder(index)}
                        className="text-red-600 text-sm"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={sh.name}
                        onChange={(e) =>
                          updateShareholder(index, { name: e.target.value })
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Number of Shares / Contribution Interest</Label>
                      <Input
                        value={sh.shares}
                        onChange={(e) =>
                          updateShareholder(index, { shares: e.target.value })
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Textarea
                        value={sh.address}
                        onChange={(e) =>
                          updateShareholder(index, { address: e.target.value })
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <Button type="button" variant="outline" onClick={addShareholder}>
                Add Shareholder
              </Button>
            </div>
          )}

          {/* STEP 5 — ULTIMATE BENEFICIAL OWNERS */}
          {FORM_STEPS[currentStep].id === "ubos" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">
                5. Ultimate Beneficial Owners
              </h3>

              <p className="text-sm text-muted-foreground">
                If the members/shareholders differ from the ultimate beneficial
                owner(s), please list them here.
              </p>

              {formData.ubos.length === 0 && (
                <p className="text-sm text-muted-foreground italic">
                  No UBOs added yet.
                </p>
              )}

              <div className="space-y-4">
                {formData.ubos.map((ubo, index) => (
                  <div
                    key={index}
                    className="border rounded-md p-4 space-y-4 bg-background"
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">
                        Ultimate Beneficial Owner #{index + 1}
                      </h4>
                      <button
                        type="button"
                        className="text-red-600 text-sm"
                        onClick={() => removeUbo(index)}
                      >
                        Remove
                      </button>
                    </div>

                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={ubo.name}
                        onChange={(e) =>
                          updateUbo(index, { name: e.target.value })
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Textarea
                        value={ubo.address}
                        onChange={(e) =>
                          updateUbo(index, { address: e.target.value })
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <Button type="button" variant="outline" onClick={addUbo}>
                Add UBO
              </Button>
            </div>
          )}

          {/* STEP 6 — DIRECTORS / OFFICERS */}
          {FORM_STEPS[currentStep].id === "directors" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">6. Directors / Officers</h3>

              <p className="text-sm text-muted-foreground">
                Provide details of directors, managers, general partners, and
                officers / limited partners.
              </p>

              {/* Directors */}
              <div className="space-y-4">
                <h4 className="font-medium">
                  Directors / Manager / GP / Supervisor
                </h4>

                {formData.directors.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">
                    No directors/managers added yet.
                  </p>
                )}

                {formData.directors.map((dir, index) => (
                  <div
                    key={index}
                    className="border rounded-md p-4 space-y-4 bg-background"
                  >
                    <div className="flex justify-between items-center">
                      <h5 className="font-medium">Director #{index + 1}</h5>
                      <button
                        type="button"
                        className="text-red-600 text-sm"
                        onClick={() => removeDirector(index)}
                      >
                        Remove
                      </button>
                    </div>

                    {/* Position Type */}
                    <div className="space-y-2">
                      <Label>Position Type</Label>
                      <Select
                        value={dir.positionType}
                        onValueChange={(value) =>
                          updateDirector(index, { positionType: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select position type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Director">Director</SelectItem>
                          <SelectItem value="General Partner">
                            General Partner
                          </SelectItem>
                          <SelectItem value="Manager">Manager</SelectItem>
                          <SelectItem value="Supervisor">Supervisor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={dir.name}
                        onChange={(e) =>
                          updateDirector(index, { name: e.target.value })
                        }
                      />
                    </div>

                    {/* Address Type */}
                    <div className="space-y-2">
                      <Label>Address Type</Label>
                      <Select
                        value={dir.addressType}
                        onValueChange={(value) =>
                          updateDirector(index, { addressType: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select address type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Business">Business</SelectItem>
                          <SelectItem value="Residential">
                            Residential
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Address */}
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Textarea
                        value={dir.address}
                        onChange={(e) =>
                          updateDirector(index, { address: e.target.value })
                        }
                      />
                    </div>
                  </div>
                ))}

                <Button type="button" variant="outline" onClick={addDirector}>
                  Add Director / Manager / GP / Supervisor
                </Button>
              </div>

              {/* Officers / LP */}
              <div className="space-y-4">
                <h4 className="font-medium">Officers / Limited Partners</h4>

                {(!formData.officers || formData.officers.length === 0) && (
                  <p className="text-sm text-muted-foreground italic">
                    No officers / limited partners added yet.
                  </p>
                )}

                {formData.officers?.map((off, index) => (
                  <div
                    key={index}
                    className="border rounded-md p-4 space-y-4 bg-background"
                  >
                    <div className="flex justify-between items-center">
                      <h5 className="font-medium">
                        Officer / Limited Partner #{index + 1}
                      </h5>
                      <button
                        type="button"
                        className="text-red-600 text-sm"
                        onClick={() => removeOfficer(index)}
                      >
                        Remove
                      </button>
                    </div>

                    <div className="space-y-2">
                      <Label>Position Type</Label>
                      <Select
                        value={off.positionType}
                        onValueChange={(value) =>
                          updateOfficer(index, { positionType: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select position type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Officer">Officer</SelectItem>
                          <SelectItem value="Limited Partner">
                            Limited Partner
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={off.name}
                        onChange={(e) =>
                          updateOfficer(index, { name: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Address Type</Label>
                      <Select
                        value={off.addressType}
                        onValueChange={(value) =>
                          updateOfficer(index, { addressType: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select address type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Business">Business</SelectItem>
                          <SelectItem value="Residential">
                            Residential
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Textarea
                        value={off.address}
                        onChange={(e) =>
                          updateOfficer(index, { address: e.target.value })
                        }
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Office Held</Label>
                        <Input
                          value={off.officeHeld || ""}
                          onChange={(e) =>
                            updateOfficer(index, {
                              officeHeld: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div>
                        <Label>Contribution Interest</Label>
                        <Input
                          value={off.contributionInterest || ""}
                          onChange={(e) =>
                            updateOfficer(index, {
                              contributionInterest: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <Button type="button" variant="outline" onClick={addOfficer}>
                  Add Officer / Limited Partner
                </Button>
              </div>
            </div>
          )}

          {/* STEP 7 — CONTACT DETAILS */}
          {FORM_STEPS[currentStep].id === "contact" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">7. Contact Details</h3>
              <p className="text-sm text-muted-foreground">
                Provide details of the primary contact for this engagement.
              </p>

              <div className="space-y-2">
                <Label>Contact Name</Label>
                <Input
                  value={formData.contactDetails?.contactName || ""}
                  onChange={(e) =>
                    updateContactDetails({ contactName: e.target.value })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <Label>Contact Email</Label>
                <Input
                  type="email"
                  value={formData.contactDetails?.contactEmail || ""}
                  onChange={(e) =>
                    updateContactDetails({ contactEmail: e.target.value })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <Label>Contact Phone</Label>
                <Input
                  value={formData.contactDetails?.contactPhone || ""}
                  onChange={(e) =>
                    updateContactDetails({ contactPhone: e.target.value })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
          )}

          {/* STEP 8 — SERVICE REQUEST */}
          {FORM_STEPS[currentStep].id === "service" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">8. Service Request</h3>
              <p className="text-sm text-muted-foreground">
                Describe any additional service requests or notes for
                Silverside.
              </p>

              <div className="space-y-2">
                <Label>Service Request / Notes</Label>
                <Textarea
                  placeholder="E.g. timeline expectations, special service needs, etc."
                  value={formData.serviceRequest?.notes || ""}
                  onChange={(e) =>
                    updateServiceRequest({ notes: e.target.value })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
          )}

          {/* STEP 9 — REVIEW & SIGN (BVI-style layout + Cayman wording) */}
          {FORM_STEPS[currentStep].id === "review" && (
            <div className="space-y-8">
              <h3 className="text-lg font-semibold">9. Review & Submit</h3>

              {/* Summary Top: Names / Entity / Business */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium">Entity & Names</h4>
                  <SummaryRow
                    label="New entity?"
                    value={
                      formData.companyNames.isExistingEntity ? "No" : "Yes"
                    }
                  />
                  <SummaryRow
                    label="First proposed name"
                    value={formData.companyNames.firstName}
                  />
                  <SummaryRow
                    label="Second proposed name"
                    value={formData.companyNames.secondName}
                  />
                  <SummaryRow
                    label="Existing registered name"
                    value={formData.companyNames.currentName}
                  />
                  <SummaryRow
                    label="Type of entity"
                    value={formData.entityType || "—"}
                  />
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Business Summary</h4>
                  <SummaryRow
                    label="Proposed / existing activities"
                    value={formData.businessActivity?.proposedActivities || "—"}
                  />
                  <SummaryRow
                    label="ROC nature of business"
                    value={
                      formData.businessActivity?.rocNatureOfBusiness || "—"
                    }
                  />
                  <SummaryRow
                    label="Financial year end"
                    value={formData.businessActivity?.financialYearEnd || "—"}
                  />
                  <SummaryRow
                    label="Source of funds"
                    value={formData.businessActivity?.sourceOfFunds || "—"}
                  />
                  <SummaryRow
                    label="Fund source location(s)"
                    value={formData.businessActivity?.fundSourceLocation || "—"}
                  />
                </div>
              </div>

              {/* Shareholders & UBOs / Directors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium">Shareholders</h4>
                  {formData.shareholders.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No shareholders listed.
                    </p>
                  ) : (
                    formData.shareholders.map((sh, i) => (
                      <div key={i} className="text-sm">
                        •{" "}
                        <span className="font-medium">
                          {sh.name || "Unnamed"}
                        </span>{" "}
                        — {sh.shares || "N/A"} — {sh.address || "No address"}
                      </div>
                    ))
                  )}

                  <h4 className="font-medium mt-4">
                    Ultimate Beneficial Owners
                  </h4>
                  {formData.ubos.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No UBOs listed.
                    </p>
                  ) : (
                    formData.ubos.map((ubo, i) => (
                      <div key={i} className="text-sm">
                        •{" "}
                        <span className="font-medium">
                          {ubo.name || "Unnamed"}
                        </span>{" "}
                        — {ubo.address || "No address"}
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Directors / Officers</h4>
                  {formData.directors.length === 0 &&
                  (!formData.officers || formData.officers.length === 0) ? (
                    <p className="text-sm text-muted-foreground">
                      No directors or officers listed.
                    </p>
                  ) : (
                    <>
                      {formData.directors.map((d, i) => (
                        <div key={`dir-${i}`} className="text-sm">
                          • <span className="font-medium">{d.name}</span> —{" "}
                          {d.positionType || "Director"} — {d.addressType},{" "}
                          {d.address}
                        </div>
                      ))}
                      {formData.officers?.map((o, i) => (
                        <div key={`off-${i}`} className="text-sm">
                          • <span className="font-medium">{o.name}</span> —{" "}
                          {o.positionType || "Officer"} — {o.addressType},{" "}
                          {o.address}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* Declaration + Signature (Cayman wording, BVI layout) */}
              <div className="space-y-6 border rounded-lg p-6 mt-8">
                <h4 className="text-lg font-semibold">Declaration</h4>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  I/we certify to be duly authorized representative(s) of the
                  proposed or existing entity and that the foregoing information
                  is, to the best of my/our knowledge, true and correct. I/we
                  also confirm that the parties listed on the form have
                  consented and authorized me/us to act on their behalf to
                  engage Silverside Management Ltd as its Registered Office
                  provider in the Cayman Islands.
                </p>

                {/* Completed by name */}
                <div className="space-y-2">
                  <Label>Completed By (Full Name) *</Label>
                  <Input
                    value={formData.completedByName || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        completedByName: e.target.value,
                      }))
                    }
                    placeholder="Enter your full legal name"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  />
                </div>

                {/* Signature Section */}
                <div className="space-y-4">
                  <Label className="font-medium">Signature Method *</Label>

                  {/* Choose method */}
                  {!formData.signatureType && signatureMethod === null && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setSignatureMethod("draw")}
                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
                      >
                        <span className="font-medium">Draw Signature</span>
                        <p className="text-sm text-muted-foreground">
                          Use your mouse to draw your signature
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

                  {/* Drawing pad */}
                  {signatureMethod === "draw" && !formData.signatureType && (
                    <div className="border rounded-lg p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <Label>Draw your signature below</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={clearSignature}
                        >
                          Clear
                        </Button>
                      </div>

                      <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white">
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
                        >
                          Back
                        </Button>
                        <Button
                          type="button"
                          onClick={saveDrawnSignature}
                          disabled={!signaturePreview || isSignatureUploading}
                        >
                          {isSignatureUploading ? "Saving…" : "Save Signature"}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Upload signature */}
                  {signatureMethod === "upload" && !formData.signatureType && (
                    <div className="border rounded-lg p-4 space-y-4">
                      <Label>Upload your signature file</Label>

                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
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
                  {(formData.signatureType === "drawn" ||
                    formData.signatureType === "uploaded") && (
                    <div className="border rounded-lg p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <Label>
                          {formData.signatureType === "drawn"
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

                      {signaturePreview && (
                        <div className="bg-white border rounded-lg p-4 flex justify-center">
                          <img
                            src={signaturePreview}
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

                {/* VERIFICATION INFO */}
                {formData.signatureType && (
                  <div className="bg-green-50 p-3 rounded-lg text-xs space-y-1 text-green-700">
                    <p>✓ Signature Type: {formData.signatureType}</p>
                    <p>
                      Signed At:{" "}
                      {formData.signedAt
                        ? new Date(formData.signedAt).toLocaleString()
                        : "—"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* NAV BUTTONS (same layout as BVI) */}
          <div className="flex gap-4 pt-6 border-t">
            {currentStep > 0 && (
              <Button type="button" variant="outline" onClick={prevStep}>
                Previous
              </Button>
            )}

            <div className="ml-auto flex gap-4">
              {currentStep < FORM_STEPS.length - 1 ? (
                <Button type="button" onClick={nextStep}>
                  Next
                </Button>
              ) : (
                <Button type="button" onClick={handleSubmit}>
                  Submit
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
