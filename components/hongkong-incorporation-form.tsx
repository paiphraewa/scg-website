"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";

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

function toArray<T = any>(value: any): T[] {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.list)) return value.list;
  return [];
}

function orObject<T extends object>(value: any, fallback: T): T {
  return value && typeof value === "object" ? value : fallback;
}

function norm(s: string) {
  return (s || "").trim().toLowerCase();
}

interface CompanyIncorporationFormProps {
  onboardingId: string;
  jurisdiction: string | null;
}

interface CompanyName {
  firstPreference: string;
  secondPreference: string;
  thirdPreference: string;
  chosenEnding: string;
}

interface Shareholder {
  id: number;
  fullName: string;
  sharesPercentage: string;
  address: string;
}

interface Director {
  id: number;
  fullName: string;
  isShareholder: boolean;
  selectedShareholderId: number | null;
}

interface CompanySecretary {
  useSCGSecretary: boolean;
  name: string;
  idNumber: string;
  address: string;
}

interface RegisteredOffice {
  useSCGOffice: boolean;
  address: string;
}

interface Declaration {
  completedByName: string;
  signature: string;
  signatureType: "drawn" | "uploaded" | null;
  signatureFile?: File | null;
  signatureDataUrl?: string;
  signatureFileName?: string;
  signedAt: string;
  ipAddress: string;
  userAgent: string;
}

const FORM_STEPS = [
  { id: "company-name", title: "Company Name", required: true },
  { id: "business", title: "Business Nature", required: true },
  { id: "shareholders", title: "Shareholders", required: true },
  { id: "directors", title: "Directors", required: true },
  { id: "secretary", title: "Company Secretary", required: true },
  { id: "registered-office", title: "Registered Office", required: true },
  { id: "share-capital", title: "Share Capital", required: true },
  { id: "review", title: "Review, Declaration & Signature", required: true },
];

const isDev = process.env.NODE_ENV === "development";

export function HongKongIncorporationForm({
  onboardingId,
  jurisdiction,
}: CompanyIncorporationFormProps) {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    companyNames: {
      firstPreference: "",
      secondPreference: "",
      thirdPreference: "",
      chosenEnding: "Limited",
    } as CompanyName,
    businessNature: "",
    requiresNomineeShareholder: false,
    shareholders: [] as Shareholder[],
    requiresNomineeDirector: false,
    directors: [] as Director[],
    companySecretary: {
      useSCGSecretary: true,
      name: "SCG Corporate Secretary Placeholder",
      idNumber: "",
      address: "",
    } as CompanySecretary,
    registeredOffice: {
      useSCGOffice: true,
      address: "SCG HK Registered Office Placeholder",
    } as RegisteredOffice,
    shareCapital: {
      totalShares: "10000",
      parValue: "1",
      currency: "HKD",
      isCustom: false,
    },
    declaration: {
      completedByName: "",
      signature: "",
      signatureType: null,
      signatureFile: null,
      signatureDataUrl: "",
      signatureFileName: "",
      signedAt: "",
      ipAddress: "",
      userAgent: "",
    } as Declaration,
    signedAt: "",
    onboardingId,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  const [isSignatureUploading, setIsSignatureUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [signatureMethod, setSignatureMethod] = useState<
    "draw" | "upload" | null
  >(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string>("");

  const lastSavedFirstPrefRef = useRef<string>("");

  // ---- Load draft ----
  useEffect(() => {
    if (isDev) {
      console.log("[DEV] Skipping loadDraft – no DB call in development");
      return;
    }

    const loadDraft = async () => {
      if (!onboardingId) return;

      setIsLoadingDraft(true);
      try {
        const response = await fetch(
          `/api/company-incorporation/draft?onboardingId=${onboardingId}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (response.ok) {
          const result = await response.json(); // expect { ok, data }
          const draftData = result?.data ?? result; // defensive: support both shapes

          if (draftData) {
            setFormData((prev) => ({
              ...prev,
              shareholders: toArray(draftData.shareholders),
              directors: toArray(draftData.directors),
              companyNames: orObject(draftData.companyNames, {
                firstPreference: "",
                secondPreference: "",
                thirdPreference: "",
                chosenEnding: "Limited",
              }),
              businessNature: draftData.businessNature ?? prev.businessNature,
              requiresNomineeShareholder: Boolean(
                draftData.requiresNomineeShareholder
              ),
              requiresNomineeDirector: Boolean(
                draftData.requiresNomineeDirector
              ),
              companySecretary: orObject(draftData.companySecretary, {
                useSCGSecretary: true,
                name: "SCG Corporate Secretary Placeholder",
                idNumber: "",
                address: "",
              }),
              registeredOffice: orObject(draftData.registeredOffice, {
                useSCGOffice: true,
                address: "SCG HK Registered Office Placeholder",
              }),
              shareCapital: orObject(draftData.shareCapital, {
                totalShares: "10000",
                parValue: "1",
                currency: "HKD",
                isCustom: false,
              }),
              declaration: orObject(draftData.declaration, {
                completedByName: "",
                signature: "",
                signatureType: null,
                signatureFile: null,
                signatureDataUrl: "",
                signatureFileName: "",
                signedAt: "",
                ipAddress: "",
                userAgent: "",
              }),
            }));

            if (draftData.signatureType) {
              setFormData((prev) => ({
                ...prev,
                declaration: {
                  ...prev.declaration,
                  signatureType: draftData.signatureType,
                  signature: draftData.signatureFilePath,
                  signatureFileName: draftData.signatureFileName,
                  completedByName: draftData.completedByName,
                  signedAt: draftData.signedAt,
                  ipAddress: draftData.ipAddress,
                  userAgent: draftData.userAgent,
                },
              }));
            }

            setSuccess("Draft loaded successfully!");
            setTimeout(() => setSuccess(""), 2500);
          }
        }
      } catch (err) {
        console.error("Error loading draft:", err);
      } finally {
        setIsLoadingDraft(false);
      }
    };

    loadDraft();
  }, [onboardingId]);

  // ---- Save draft ----
  const saveDraft = async () => {
    if (isDev) {
      console.log("[DEV] saveDraft skipped");
      return;
    }

    setIsSavingDraft(true);
    setError("");

    try {
      const normalizedData = {
        ...formData,
        shareholders: Array.isArray(formData.shareholders)
          ? formData.shareholders
          : toArray(formData.shareholders),
        directors: Array.isArray(formData.directors)
          ? formData.directors
          : toArray(formData.directors),
      };

      if (!onboardingId || !jurisdiction) {
        console.warn("Missing onboardingId or jurisdiction");
        return;
      }

      const response = await fetch("/api/company-incorporation/draft", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onboardingId,
          jurisdiction: jurisdiction || "HONGKONG",
          status: "draft",
          ...normalizedData,
          completedByName: formData.declaration.completedByName,
          signatureType: formData.declaration.signatureType,
          signatureFilePath: formData.declaration.signature,
          signatureFileName: formData.declaration.signatureFileName,
          signedAt: formData.declaration.signedAt || null,
          ipAddress: formData.declaration.ipAddress || null,
          userAgent: formData.declaration.userAgent || null,
        }),
      });

      const json = await response.json().catch(() => null);

      if (response.ok) {
        if (json?.data?.signedAt) {
          setFormData((prev) => ({
            ...prev,
            declaration: {
              ...prev.declaration,
              signedAt: json.data.signedAt,
            },
          }));
        }
        setSuccess("Draft saved");
        setTimeout(() => setSuccess(""), 2000);
      } else {
        console.error("Draft save failed:", json);
        setError(json?.error || "Failed to save draft");
      }
    } catch (err) {
      console.error("Error saving draft:", err);
      setError("Error saving draft. Please try again.");
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Debounce save when firstPreference changes (for prospect + order)
  useEffect(() => {
    if (isDev) return;
    const current = formData.companyNames?.firstPreference || "";
    const prev = lastSavedFirstPrefRef.current;

    if (!current.trim() || norm(current) === norm(prev)) return;

    const t = setTimeout(async () => {
      try {
        await saveDraft();
        lastSavedFirstPrefRef.current = current;
      } catch {
        // ignore
      }
    }, 600);

    return () => clearTimeout(t);
  }, [formData.companyNames.firstPreference]);

  // Auto-save every few seconds
  useEffect(() => {
    if (isDev) return;

    const autoSave = setTimeout(() => {
      void saveDraft();
    }, 5000);

    return () => clearTimeout(autoSave);
  }, [formData, onboardingId, jurisdiction]);

  // ---- Step Navigation ----
  const nextStep = () => {
    if (validateCurrentStep()) {
      if (currentStep < FORM_STEPS.length - 1) {
        setCurrentStep((prev) => prev + 1);
        setError("");
      }
    } else {
      setError(
        `Please complete all required fields in “${FORM_STEPS[currentStep].title}” before continuing.`
      );
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      setError("");
    }
  };

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
    setError("");
  };

  // ---- Validation ----
  const validateCurrentStep = () => {
    const currentStepConfig = FORM_STEPS[currentStep];
    if (!currentStepConfig.required) return true;

    switch (currentStepConfig.id) {
      case "company-name":
        return (
          formData.companyNames.firstPreference.trim().length > 0 &&
          formData.companyNames.chosenEnding === "Limited"
        );

      case "business":
        return formData.businessNature.trim().length > 0;

      case "shareholders": {
        if (formData.requiresNomineeShareholder) return true;
        const arr = Array.isArray(formData.shareholders)
          ? formData.shareholders
          : toArray(formData.shareholders);

        if (!arr.length) return false;

        const allFilled = arr.every(
          (sh) =>
            sh.fullName.trim() &&
            sh.sharesPercentage.trim() &&
            sh.address.trim()
        );
        const total = arr.reduce(
          (t, s) => t + (parseFloat(s.sharesPercentage) || 0),
          0
        );

        return allFilled && total === 100;
      }

      case "directors": {
        if (formData.requiresNomineeDirector) return true;
        const arr = Array.isArray(formData.directors)
          ? formData.directors
          : toArray(formData.directors);
        return arr.length > 0 && arr.every((d) => d.fullName.trim().length > 0);
      }

      case "secretary": {
        const sec = formData.companySecretary;
        if (sec.useSCGSecretary) return true;
        return (
          sec.name.trim().length > 0 &&
          sec.idNumber.trim().length > 0 &&
          sec.address.trim().length > 0
        );
      }

      case "registered-office": {
        const ro = formData.registeredOffice;
        if (ro.useSCGOffice) return true;
        return ro.address.trim().length > 0;
      }

      case "share-capital": {
        const sc = formData.shareCapital;
        if (!sc.isCustom) {
          return sc.totalShares === "10000" && sc.parValue === "1";
        }
        return (
          sc.totalShares.trim().length > 0 &&
          sc.parValue.trim().length > 0 &&
          sc.currency.trim().length > 0
        );
      }

      case "review": {
        return (
          formData.declaration.completedByName.trim().length > 0 &&
          !!formData.declaration.signature &&
          !!formData.declaration.signatureType
        );
      }

      default:
        return true;
    }
  };

  // ---- Shareholders helpers ----
  const addShareholder = () => {
    setFormData((prev) => ({
      ...prev,
      shareholders: [
        ...prev.shareholders,
        {
          id: prev.shareholders.length + 1,
          fullName: "",
          sharesPercentage: "",
          address: "",
        },
      ],
    }));
  };

  const removeShareholder = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      shareholders: prev.shareholders.filter((_, i) => i !== index),
    }));
  };

  const handleShareholderChange = (
    index: number,
    field: keyof Shareholder,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      shareholders: prev.shareholders.map((s, i) =>
        i === index ? { ...s, [field]: value } : s
      ),
    }));
  };

  const getTotalSharesPercentage = () => {
    return formData.shareholders.reduce((total, shareholder) => {
      return total + (parseFloat(shareholder.sharesPercentage) || 0);
    }, 0);
  };

  // ---- Directors helpers ----
  const addDirector = () => {
    setFormData((prev) => ({
      ...prev,
      directors: [
        ...prev.directors,
        {
          id: Date.now(),
          fullName: "",
          isShareholder: false,
          selectedShareholderId: null,
        },
      ],
    }));
  };

  const handleDirectorChange = (
    index: number,
    field: keyof Director,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      directors: prev.directors.map((d, i) =>
        i === index ? { ...d, [field]: value } : d
      ),
    }));
  };

  // ---- Signature drawing ----
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
      if (ctx) ctx.clearRect(0, 0, canvasRef.width, canvasRef.height);
    }

    setSignaturePreview("");
    setSignatureMethod(null);
    setFormData((prev) => ({
      ...prev,
      declaration: {
        ...prev.declaration,
        signatureType: null,
        signature: "",
        signatureFileName: "",
        signatureDataUrl: "",
        signatureFile: null,
      },
    }));

    const fileInput = document.getElementById(
      "signatureUpload"
    ) as HTMLInputElement | null;
    if (fileInput) fileInput.value = "";
  };

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

  async function saveDrawnSignature() {
    if (!canvasRef) return;

    const onboardingIdParam =
      formData?.onboardingId || searchParams.get("onboardingId") || "";

    if (!onboardingIdParam) {
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

      const filePath = await uploadSignatureFile(onboardingIdParam, file);

      if (!signaturePreview) {
        const reader = new FileReader();
        reader.onload = () => setSignaturePreview(String(reader.result || ""));
        reader.readAsDataURL(file);
      }

      setFormData((prev) => ({
        ...prev,
        declaration: {
          ...prev.declaration,
          signatureType: "drawn",
          signature: filePath,
          signatureFileName: "signature.png",
          signatureDataUrl: "",
          signedAt: prev.declaration.signedAt || new Date().toISOString(),
        },
      }));
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
      declaration: {
        ...prev.declaration,
        signatureType: "uploaded",
        signatureFile: file,
        signature: `Uploaded signature - ${file.name}`,
        signatureFileName: file.name,
      },
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

  const handleCompanyNameChange = (field: keyof CompanyName, value: string) => {
    setFormData((prev) => ({
      ...prev,
      companyNames: {
        ...prev.companyNames,
        [field]: value,
      },
    }));
  };

  const handleBusinessNatureChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      businessNature: value,
    }));
  };

  const handleDeclarationChange = (
    field: keyof Declaration,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      declaration: {
        ...prev.declaration,
        [field]: value,
      },
    }));
  };

  // Capture IP & user agent when signature is set
  useEffect(() => {
    const captureVerificationData = async () => {
      if (formData.declaration.signature && !formData.declaration.signedAt) {
        handleDeclarationChange("signedAt", new Date().toISOString());
        try {
          const ipResponse = await fetch("/api/ip-address");
          const ipData = await ipResponse.json();
          handleDeclarationChange("ipAddress", ipData.ip || "Unknown");
        } catch {
          handleDeclarationChange("ipAddress", "Unknown");
        }
        handleDeclarationChange("userAgent", navigator.userAgent);
      }
    };

    void captureVerificationData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.declaration.signature]);

  useEffect(() => {
    if (
      !signaturePreview &&
      formData.declaration.signatureType &&
      formData.declaration.signature
    ) {
      setSignaturePreview(formData.declaration.signature as string);
    }
  }, [
    signaturePreview,
    formData.declaration.signatureType,
    formData.declaration.signature,
  ]);

  const shareholdersArr = Array.isArray(formData.shareholders)
    ? formData.shareholders
    : toArray(formData.shareholders);

  const directorsArr = Array.isArray(formData.directors)
    ? formData.directors
    : toArray(formData.directors);

  const progress = ((currentStep + 1) / FORM_STEPS.length) * 100;

  // ---- Submit ----
  const REVIEW_INDEX = FORM_STEPS.findIndex((s) => s.id === "review");

  const handleSubmit = async (e?: React.SyntheticEvent) => {
    e?.preventDefault();

    if (currentStep !== REVIEW_INDEX) return;

    if (!validateCurrentStep()) {
      setError(
        `Please complete all required fields in “${FORM_STEPS[currentStep].title}” before submitting.`
      );
      return;
    }

    if (!formData.declaration.signatureType) {
      setError(
        "Please provide your signature using either drawing pad or file upload."
      );
      return;
    }

    if (isSubmitting) return;

    setError("");
    setIsSubmitting(true);

    try {
      const normalizedData = {
        ...formData,
        shareholders: Array.isArray(formData.shareholders)
          ? formData.shareholders
          : toArray(formData.shareholders),
        directors: Array.isArray(formData.directors)
          ? formData.directors
          : toArray(formData.directors),
      };

      const submissionData = {
        onboardingId,
        jurisdiction,
        status: "submitted",
        ...normalizedData,
        completedByName: formData.declaration.completedByName,
        signatureType: formData.declaration.signatureType,
        signatureFilePath: formData.declaration.signature,
        signatureFileName: formData.declaration.signatureFileName,
        signedAt: formData.declaration.signedAt || new Date().toISOString(),
        ipAddress: formData.declaration.ipAddress || null,
        userAgent:
          formData.declaration.userAgent ||
          (typeof navigator !== "undefined" ? navigator.userAgent : null),
      };

      const res = await fetch("/api/company-incorporation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(submissionData),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(
          json?.error || "Failed to submit company incorporation form"
        );

      alert("Hong Kong company incorporation form submitted successfully!");
      router.push(`/pricing?onboardingId=${onboardingId}`);
    } catch (err: any) {
      console.error("Form submission error:", err);
      setError(err?.message || "Error submitting form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---- Loading states ----
  if (status === "loading" || isLoadingDraft) {
    return (
      <Card className="max-w-6xl mx-auto">
        <CardContent className="p-8">
          <div className="text-center space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
            <p className="text-sm text-muted-foreground">
              Loading your Hong Kong incorporation draft…
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const jurisdictionName = getJurisdictionName(jurisdiction);

  // ============================
  // Main render
  // ============================
  return (
    <Card className="max-w-6xl mx-auto">
      <CardHeader className="space-y-4">
        <div className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            Hong Kong Company Incorporation
          </CardTitle>
          <CardDescription>
            Complete the company incorporation details for your business in{" "}
            {jurisdictionName}.
          </CardDescription>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 pt-2">
          <Progress value={progress} className="w-full" />
          <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
            <span>
              Step {currentStep + 1} of {FORM_STEPS.length}
            </span>
            <span>{FORM_STEPS[currentStep].title}</span>
          </div>
        </div>

        {/* Step pills */}
        <div className="flex overflow-x-auto pb-1 gap-2 mt-1 no-scrollbar">
          {FORM_STEPS.map((step, index) => (
            <button
              key={step.id}
              type="button"
              onClick={() => goToStep(index)}
              className={`flex-shrink-0 px-3 py-1.5 text-xs sm:text-sm rounded-full border transition-colors ${
                index === currentStep
                  ? "bg-blue-600 text-white border-blue-600"
                  : index < currentStep
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-slate-50 text-slate-600 border-slate-200"
              }`}
            >
              {step.title}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <form
          onSubmit={(e) => e.preventDefault()}
          onKeyDown={(e) => {
            if (e.key === "Enter" && currentStep !== REVIEW_INDEX)
              e.preventDefault();
          }}
          className="space-y-8"
        >
          {/* Alerts */}
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 text-emerald-700 text-sm p-3 rounded-md flex items-center justify-between">
              <span>{success}</span>
              {isSavingDraft && (
                <span className="text-xs opacity-80">Saving…</span>
              )}
            </div>
          )}

          {/* === STEP 1: Company Name === */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                1. Company Name Preferences
              </h3>
              <p className="text-sm text-muted-foreground">
                Provide up to three company name options in order of preference.
                Hong Kong company names must end with <strong>“Limited”</strong>
                .
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstPreference">First preference *</Label>
                  <Input
                    id="firstPreference"
                    value={formData.companyNames.firstPreference}
                    onChange={(e) =>
                      handleCompanyNameChange("firstPreference", e.target.value)
                    }
                    placeholder="First preference company name"
                    className="h-10 text-sm"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondPreference">Second preference</Label>
                  <Input
                    id="secondPreference"
                    value={formData.companyNames.secondPreference}
                    onChange={(e) =>
                      handleCompanyNameChange(
                        "secondPreference",
                        e.target.value
                      )
                    }
                    placeholder="Second preference company name"
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thirdPreference">Third preference</Label>
                  <Input
                    id="thirdPreference"
                    value={formData.companyNames.thirdPreference}
                    onChange={(e) =>
                      handleCompanyNameChange("thirdPreference", e.target.value)
                    }
                    placeholder="Third preference company name"
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chosenEnding">Company ending *</Label>
                  <select
                    id="chosenEnding"
                    value={formData.companyNames.chosenEnding}
                    onChange={(e) =>
                      handleCompanyNameChange("chosenEnding", e.target.value)
                    }
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="Limited">Limited</option>
                  </select>
                  <p className="text-xs text-muted-foreground">
                    For Hong Kong companies, “Limited” is required.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* === STEP 2: Business Nature === */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">2. Nature of Business</h3>
              <p className="text-sm text-muted-foreground">
                Briefly describe the main business activities, typical
                customers, and products or services offered.
              </p>

              <div className="space-y-2">
                <Label htmlFor="businessNature">
                  Business nature / activities *
                </Label>
                <Textarea
                  id="businessNature"
                  value={formData.businessNature}
                  onChange={(e) => handleBusinessNatureChange(e.target.value)}
                  placeholder="Example: Online retail of consumer electronics to customers in Hong Kong and Asia-Pacific."
                  className="min-h-32 text-sm"
                  rows={6}
                  required
                />
              </div>
            </div>
          )}

          {/* === STEP 3: Shareholders === */}
          {currentStep === 2 &&
            (() => {
              const arr = shareholdersArr;
              const totalPct = getTotalSharesPercentage();

              return (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">
                    3. Shareholder Information
                  </h3>

                  <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                    <h4 className="font-medium text-sm">
                      Do you require a nominee shareholder?
                    </h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      If you select <strong>“Yes”</strong>, SCG will provide a
                      nominee shareholder (additional fees apply). If{" "}
                      <strong>“No”</strong>, please provide details of all
                      shareholders below.
                    </p>

                    <div className="flex flex-col sm:flex-row sm:space-x-6 space-y-2 sm:space-y-0 pt-1">
                      <label className="flex items-center space-x-2 text-sm">
                        <input
                          type="radio"
                          id="nomineeShareholderYes"
                          name="nomineeShareholder"
                          checked={formData.requiresNomineeShareholder}
                          onChange={() =>
                            setFormData((prev) => ({
                              ...prev,
                              requiresNomineeShareholder: true,
                              shareholders: [],
                            }))
                          }
                          className="h-4 w-4 text-blue-600"
                        />
                        <span>Yes, I need a nominee shareholder</span>
                      </label>

                      <label className="flex items-center space-x-2 text-sm">
                        <input
                          type="radio"
                          id="nomineeShareholderNo"
                          name="nomineeShareholder"
                          checked={!formData.requiresNomineeShareholder}
                          onChange={() =>
                            setFormData((prev) => ({
                              ...prev,
                              requiresNomineeShareholder: false,
                              shareholders:
                                prev.shareholders.length > 0
                                  ? prev.shareholders
                                  : [
                                      {
                                        id: 1,
                                        fullName: "",
                                        sharesPercentage: "",
                                        address: "",
                                      },
                                    ],
                            }))
                          }
                          className="h-4 w-4 text-blue-600"
                        />
                        <span>No, I will be providing my shareholders</span>
                      </label>
                    </div>
                  </div>

                  {!formData.requiresNomineeShareholder && (
                    <>
                      <div className="space-y-4">
                        {arr.map((shareholder, index) => (
                          <div
                            key={shareholder.id}
                            className="border rounded-lg p-4 space-y-4 bg-background"
                          >
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium text-sm">
                                Shareholder #{index + 1}
                              </h4>
                              {arr.length > 1 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeShareholder(index)}
                                >
                                  Remove
                                </Button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor={`sh-name-${index}`}>
                                  Full Name *
                                </Label>
                                <Input
                                  id={`sh-name-${index}`}
                                  value={shareholder.fullName}
                                  onChange={(e) =>
                                    handleShareholderChange(
                                      index,
                                      "fullName",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Full legal name"
                                  className="h-10 text-sm"
                                  required
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`sh-pct-${index}`}>
                                  Shareholding (%) *
                                </Label>
                                <Input
                                  id={`sh-pct-${index}`}
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.01"
                                  value={shareholder.sharesPercentage}
                                  onChange={(e) =>
                                    handleShareholderChange(
                                      index,
                                      "sharesPercentage",
                                      e.target.value
                                    )
                                  }
                                  placeholder="e.g. 50.00"
                                  className="h-10 text-sm"
                                  required
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`sh-address-${index}`}>
                                Address *
                              </Label>
                              <Textarea
                                id={`sh-address-${index}`}
                                value={shareholder.address}
                                onChange={(e) =>
                                  handleShareholderChange(
                                    index,
                                    "address",
                                    e.target.value
                                  )
                                }
                                placeholder="Residential or registered address"
                                className="text-sm"
                                rows={3}
                                required
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addShareholder}
                          size="sm"
                        >
                          + Add shareholder
                        </Button>

                        {arr.length > 0 && (
                          <div
                            className={`px-3 py-2 rounded-md text-xs sm:text-sm ${
                              totalPct === 100
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-amber-50 text-amber-800 border border-amber-200"
                            }`}
                          >
                            <strong>
                              {totalPct === 100
                                ? "✓ Total shareholding: 100% (valid)"
                                : `Total shareholding: ${totalPct}% — must equal 100%`}
                            </strong>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })()}

          {/* === STEP 4: Directors === */}
          {currentStep === 3 &&
            (() => {
              const shArr = shareholdersArr;
              const dirArr = directorsArr;

              return (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">
                    4. Director Information
                  </h3>

                  <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                    <h4 className="font-medium text-sm">
                      Do you require a nominee director?
                    </h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      If you select <strong>“Yes”</strong>, SCG will provide a
                      nominee director (additional fees apply). If{" "}
                      <strong>“No”</strong>, please provide details of all
                      directors below.
                    </p>

                    <div className="flex flex-col sm:flex-row sm:space-x-6 space-y-2 sm:space-y-0 pt-1">
                      <label className="flex items-center space-x-2 text-sm">
                        <input
                          type="radio"
                          id="nomineeDirectorYes"
                          name="nomineeDirector"
                          checked={formData.requiresNomineeDirector}
                          onChange={() =>
                            setFormData((prev) => ({
                              ...prev,
                              requiresNomineeDirector: true,
                              directors: [],
                            }))
                          }
                          className="h-4 w-4 text-blue-600"
                        />
                        <span>Yes, I need a nominee director</span>
                      </label>

                      <label className="flex items-center space-x-2 text-sm">
                        <input
                          type="radio"
                          id="nomineeDirectorNo"
                          name="nomineeDirector"
                          checked={!formData.requiresNomineeDirector}
                          onChange={() =>
                            setFormData((prev) => ({
                              ...prev,
                              requiresNomineeDirector: false,
                              directors:
                                prev.directors.length > 0
                                  ? prev.directors
                                  : [
                                      {
                                        id: 1,
                                        fullName: "",
                                        isShareholder: false,
                                        selectedShareholderId: null,
                                      },
                                    ],
                            }))
                          }
                          className="h-4 w-4 text-blue-600"
                        />
                        <span>No, I will be providing my directors</span>
                      </label>
                    </div>
                  </div>

                  {!formData.requiresNomineeDirector && (
                    <div className="space-y-6">
                      {shArr.length > 0 && (
                        <div className="border rounded-lg p-4 space-y-3 bg-background">
                          <h4 className="font-medium text-sm">
                            Shareholders who are also directors
                          </h4>
                          {shArr.map((shareholder) => {
                            const isSelected = dirArr.some(
                              (d) =>
                                d.selectedShareholderId === shareholder.id &&
                                d.isShareholder
                            );
                            return (
                              <label
                                key={shareholder.id}
                                className="flex items-center space-x-2 text-sm"
                              >
                                <Checkbox
                                  id={`sh-dir-${shareholder.id}`}
                                  checked={isSelected}
                                  onCheckedChange={(checked) => {
                                    const isChecked = Boolean(checked);
                                    if (isChecked) {
                                      const newDirector: Director = {
                                        id: Date.now() + shareholder.id,
                                        fullName: shareholder.fullName,
                                        isShareholder: true,
                                        selectedShareholderId: shareholder.id,
                                      };
                                      setFormData((prev) => ({
                                        ...prev,
                                        directors: [
                                          ...prev.directors,
                                          newDirector,
                                        ],
                                      }));
                                    } else {
                                      setFormData((prev) => ({
                                        ...prev,
                                        directors: prev.directors.filter(
                                          (d) =>
                                            d.selectedShareholderId !==
                                            shareholder.id
                                        ),
                                      }));
                                    }
                                  }}
                                />
                                <span>
                                  {shareholder.fullName} (
                                  {shareholder.sharesPercentage}% shares)
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      <div className="border rounded-lg p-4 space-y-4 bg-background">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">
                            Additional directors (not shareholders)
                          </h4>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addDirector}
                          >
                            + Add director
                          </Button>
                        </div>

                        {dirArr
                          .filter((d) => !d.isShareholder)
                          .map((director, index) => (
                            <div
                              key={director.id}
                              className="border rounded-lg p-4 space-y-3 bg-muted/40"
                            >
                              <div className="flex justify-between items-center">
                                <h5 className="font-medium text-sm">
                                  Director #{index + 1}
                                </h5>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      directors: prev.directors.filter(
                                        (d) => d.id !== director.id
                                      ),
                                    }))
                                  }
                                >
                                  Remove
                                </Button>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`dir-name-${director.id}`}>
                                  Full Name *
                                </Label>
                                <Input
                                  id={`dir-name-${director.id}`}
                                  value={director.fullName}
                                  onChange={(e) =>
                                    handleDirectorChange(
                                      index,
                                      "fullName",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Full legal name"
                                  className="h-10 text-sm"
                                  required
                                />
                              </div>
                            </div>
                          ))}

                        {dirArr.length > 0 && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs sm:text-sm text-blue-800">
                            <h4 className="font-medium mb-1">
                              Selected directors
                            </h4>
                            <ul className="space-y-0.5">
                              {dirArr.map((d) => (
                                <li key={d.id}>
                                  •{" "}
                                  <span className="font-medium">
                                    {d.fullName || "Unnamed"}
                                  </span>
                                  {d.isShareholder && (
                                    <span className="text-green-700">
                                      {" "}
                                      (also shareholder)
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

          {/* === STEP 5: Company Secretary === */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">
                5. Company Secretary (Hong Kong Requirement)
              </h3>
              <p className="text-sm text-muted-foreground">
                Every Hong Kong company must appoint a company secretary (an
                individual residing in Hong Kong or a licensed corporate
                secretary).
              </p>

              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <h4 className="font-medium text-sm">
                  How would you like to appoint the company secretary?
                </h4>

                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="radio"
                      id="useSCGSecretary"
                      name="companySecretaryOption"
                      checked={formData.companySecretary.useSCGSecretary}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          companySecretary: {
                            ...prev.companySecretary,
                            useSCGSecretary: true,
                            name: "SCG Corporate Secretary Placeholder",
                            idNumber: "",
                            address: "",
                          },
                        }))
                      }
                      className="h-4 w-4 text-blue-600"
                    />
                    <span>Use SCG corporate secretary service</span>
                  </label>

                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="radio"
                      id="ownSecretary"
                      name="companySecretaryOption"
                      checked={!formData.companySecretary.useSCGSecretary}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          companySecretary: {
                            ...prev.companySecretary,
                            useSCGSecretary: false,
                            name: "",
                            idNumber: "",
                            address: "",
                          },
                        }))
                      }
                      className="h-4 w-4 text-blue-600"
                    />
                    <span>I will provide my own company secretary</span>
                  </label>
                </div>
              </div>

              {formData.companySecretary.useSCGSecretary ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-xs sm:text-sm text-blue-800">
                  SCG Corporate Secretary Placeholder will be appointed as the
                  company secretary of the Hong Kong company.
                </div>
              ) : (
                <div className="border rounded-lg p-4 space-y-4 bg-background">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sec-name">Company Secretary Name *</Label>
                      <Input
                        id="sec-name"
                        value={formData.companySecretary.name}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            companySecretary: {
                              ...prev.companySecretary,
                              name: e.target.value,
                            },
                          }))
                        }
                        placeholder="Individual or corporate secretary name"
                        className="h-10 text-sm"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sec-id">
                        HKID / Business Registration number *
                      </Label>
                      <Input
                        id="sec-id"
                        value={formData.companySecretary.idNumber}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            companySecretary: {
                              ...prev.companySecretary,
                              idNumber: e.target.value,
                            },
                          }))
                        }
                        placeholder="HKID or BR number"
                        className="h-10 text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sec-address">
                      Company Secretary Address *
                    </Label>
                    <Textarea
                      id="sec-address"
                      value={formData.companySecretary.address}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          companySecretary: {
                            ...prev.companySecretary,
                            address: e.target.value,
                          },
                        }))
                      }
                      placeholder="Registered address in Hong Kong"
                      className="text-sm"
                      rows={3}
                      required
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* === STEP 6: Registered Office === */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">
                6. Registered Office Address
              </h3>
              <p className="text-sm text-muted-foreground">
                Every Hong Kong company must have a registered office address in
                Hong Kong. This address appears on public records.
              </p>

              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <h4 className="font-medium text-sm">
                  How would you like to set the registered office?
                </h4>

                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="radio"
                      id="useSCGOffice"
                      name="registeredOfficeOption"
                      checked={formData.registeredOffice.useSCGOffice}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          registeredOffice: {
                            ...prev.registeredOffice,
                            useSCGOffice: true,
                            address: "SCG HK Registered Office Placeholder",
                          },
                        }))
                      }
                      className="h-4 w-4 text-blue-600"
                    />
                    <span>Use SCG registered office service</span>
                  </label>

                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="radio"
                      id="ownOffice"
                      name="registeredOfficeOption"
                      checked={!formData.registeredOffice.useSCGOffice}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          registeredOffice: {
                            ...prev.registeredOffice,
                            useSCGOffice: false,
                            address: "",
                          },
                        }))
                      }
                      className="h-4 w-4 text-blue-600"
                    />
                    <span>I will provide my own Hong Kong address</span>
                  </label>
                </div>
              </div>

              {formData.registeredOffice.useSCGOffice ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-xs sm:text-sm text-blue-800">
                  The registered office will be:
                  <br />
                  <strong>{formData.registeredOffice.address}</strong>
                </div>
              ) : (
                <div className="border rounded-lg p-4 space-y-2 bg-background">
                  <Label htmlFor="ro-address">
                    Registered office address (Hong Kong) *
                  </Label>
                  <Textarea
                    id="ro-address"
                    value={formData.registeredOffice.address}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        registeredOffice: {
                          ...prev.registeredOffice,
                          address: e.target.value,
                        },
                      }))
                    }
                    placeholder="Full registered office address in Hong Kong"
                    className="text-sm"
                    rows={3}
                    required
                  />
                </div>
              )}
            </div>
          )}

          {/* === STEP 7: Share Capital === */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">7. Share Capital</h3>
              <p className="text-sm text-muted-foreground">
                By default, Hong Kong private companies are incorporated with{" "}
                <strong>10,000 shares of HKD 1 each</strong> (total share
                capital HKD 10,000).
              </p>

              <div className="space-y-4">
                {/* Standard capital */}
                <div className="border rounded-lg p-4 space-y-2 bg-background">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <Label className="font-medium text-sm">
                        Standard share capital (recommended)
                      </Label>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        10,000 shares @ HKD 1 per share (HKD 10,000 total).
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="standardCapital"
                        checked={!formData.shareCapital.isCustom}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => {
                            const isChecked = Boolean(checked);
                            return {
                              ...prev,
                              shareCapital: {
                                ...prev.shareCapital,
                                isCustom: !isChecked,
                                totalShares: isChecked
                                  ? "10000"
                                  : prev.shareCapital.totalShares,
                                parValue: isChecked
                                  ? "1"
                                  : prev.shareCapital.parValue,
                                currency: "HKD",
                              },
                            };
                          })
                        }
                      />
                      <Label htmlFor="standardCapital" className="text-sm">
                        Use standard
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Custom capital */}
                <div className="border rounded-lg p-4 space-y-3 bg-background">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="customCapital"
                      checked={formData.shareCapital.isCustom}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          shareCapital: {
                            ...prev.shareCapital,
                            isCustom: Boolean(checked),
                          },
                        }))
                      }
                    />
                    <Label htmlFor="customCapital" className="text-sm">
                      I want to specify custom share capital
                    </Label>
                  </div>

                  {formData.shareCapital.isCustom && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                      <div className="space-y-2">
                        <Label htmlFor="totalShares">Number of shares *</Label>
                        <Input
                          id="totalShares"
                          value={formData.shareCapital.totalShares}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              shareCapital: {
                                ...prev.shareCapital,
                                totalShares: e.target.value,
                              },
                            }))
                          }
                          placeholder="e.g. 100000"
                          className="h-10 text-sm"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="parValue">Par value (HKD) *</Label>
                        <Input
                          id="parValue"
                          value={formData.shareCapital.parValue}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              shareCapital: {
                                ...prev.shareCapital,
                                parValue: e.target.value,
                              },
                            }))
                          }
                          placeholder="e.g. 1"
                          className="h-10 text-sm"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="currency">Currency *</Label>
                        <Input
                          id="currency"
                          value={formData.shareCapital.currency}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              shareCapital: {
                                ...prev.shareCapital,
                                currency: e.target.value,
                              },
                            }))
                          }
                          placeholder="HKD"
                          className="h-10 text-sm"
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* === STEP 8: Review + Declaration + Signature === */}
          {currentStep === REVIEW_INDEX && (
            <div className="space-y-8">
              <h3 className="text-lg font-semibold">
                8. Review, Declaration & Signature
              </h3>

              {/* Review summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Company</h4>
                  <SummaryRow
                    label="1st preference"
                    value={formData.companyNames.firstPreference}
                  />
                  <SummaryRow
                    label="2nd preference"
                    value={formData.companyNames.secondPreference}
                  />
                  <SummaryRow
                    label="3rd preference"
                    value={formData.companyNames.thirdPreference}
                  />
                  <SummaryRow
                    label="Ending"
                    value={formData.companyNames.chosenEnding}
                  />
                  <SummaryRow
                    label="Business nature"
                    value={formData.businessNature}
                  />
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Share Capital</h4>
                  <SummaryRow
                    label="Total shares"
                    value={formData.shareCapital.totalShares}
                  />
                  <SummaryRow
                    label="Par value"
                    value={formData.shareCapital.parValue}
                  />
                  <SummaryRow
                    label="Currency"
                    value={formData.shareCapital.currency}
                  />
                  <SummaryRow
                    label="Custom structure"
                    value={formData.shareCapital.isCustom ? "Yes" : "No"}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">
                    Shareholders{" "}
                    {formData.requiresNomineeShareholder ? "(Nominee)" : ""}
                  </h4>
                  {formData.requiresNomineeShareholder ? (
                    <p className="text-sm text-muted-foreground">
                      Nominee shareholder service requested.
                    </p>
                  ) : shareholdersArr.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No shareholders provided.
                    </p>
                  ) : (
                    shareholdersArr.map((sh) => (
                      <div key={sh.id} className="text-sm">
                        • <span className="font-medium">{sh.fullName}</span> —{" "}
                        {sh.sharesPercentage}% — {sh.address}
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-sm">
                    Directors{" "}
                    {formData.requiresNomineeDirector ? "(Nominee)" : ""}
                  </h4>
                  {formData.requiresNomineeDirector ? (
                    <p className="text-sm text-muted-foreground">
                      Nominee director service requested.
                    </p>
                  ) : directorsArr.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No directors provided.
                    </p>
                  ) : (
                    directorsArr.map((d) => (
                      <div key={d.id} className="text-sm">
                        • <span className="font-medium">{d.fullName}</span>
                        {d.isShareholder && (
                          <span className="text-green-600">
                            {" "}
                            (also shareholder)
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Company Secretary</h4>
                  {formData.companySecretary.useSCGSecretary ? (
                    <>
                      <SummaryRow
                        label="Type"
                        value="SCG corporate secretary service"
                      />
                      <SummaryRow
                        label="Name"
                        value={formData.companySecretary.name}
                      />
                    </>
                  ) : (
                    <>
                      <SummaryRow
                        label="Name"
                        value={formData.companySecretary.name}
                      />
                      <SummaryRow
                        label="ID / BR number"
                        value={formData.companySecretary.idNumber}
                      />
                      <SummaryRow
                        label="Address"
                        value={formData.companySecretary.address}
                      />
                    </>
                  )}
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Registered Office</h4>
                  {formData.registeredOffice.useSCGOffice ? (
                    <>
                      <SummaryRow
                        label="Type"
                        value="SCG registered office service"
                      />
                      <SummaryRow
                        label="Address"
                        value={formData.registeredOffice.address}
                      />
                    </>
                  ) : (
                    <SummaryRow
                      label="Address"
                      value={formData.registeredOffice.address}
                    />
                  )}
                </div>
              </div>

              {/* Declaration */}
              <div className="space-y-4 border rounded-lg p-4 bg-background">
                <h4 className="text-sm font-semibold">Declaration</h4>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  I confirm that all information provided in this form is true,
                  complete and accurate to the best of my knowledge. I
                  understand that this information will be used to proceed with
                  the incorporation of the Hong Kong company and the related
                  corporate services.
                </p>

                <div className="space-y-2">
                  <Label>Completed by (Full Name) *</Label>
                  <Input
                    value={formData.declaration.completedByName}
                    onChange={(e) =>
                      handleDeclarationChange("completedByName", e.target.value)
                    }
                    placeholder="Enter your full legal name"
                    className="h-10 text-sm"
                    required
                  />
                </div>

                {/* Signature Section — BVI style */}
                <div className="space-y-4 pt-3">
                  <Label className="font-medium text-sm">
                    Signature (draw or upload) *
                  </Label>

                  {/* No signature chosen yet */}
                  {!formData.declaration.signatureType && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setSignatureMethod("draw");
                        }}
                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
                      >
                        <span className="font-medium text-sm">
                          Draw signature
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">
                          Use your mouse or trackpad
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSignatureMethod("upload");
                        }}
                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
                      >
                        <span className="font-medium text-sm">
                          Upload signature
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG, JPG, PDF up to 5MB
                        </p>
                      </button>
                    </div>
                  )}

                  {/* DRAW MODE */}
                  {signatureMethod === "draw" &&
                    !formData.declaration.signatureType && (
                      <div className="border rounded-lg p-4 space-y-4 bg-white">
                        <Label className="font-medium text-sm">
                          Draw your signature below
                        </Label>

                        <div className="border-2 border-dashed border-gray-300 bg-white rounded-lg">
                          <canvas
                            ref={setCanvasRef}
                            width={700}
                            height={200}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            className="cursor-crosshair bg-white rounded-md block"
                            style={{
                              width: "100%",
                              height: 200,
                              touchAction: "none",
                            }}
                          />
                        </div>

                        <div className="flex gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSignatureMethod(null);
                              clearSignature();
                            }}
                          >
                            Cancel
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            onClick={saveDrawnSignature}
                            disabled={!signaturePreview || isSignatureUploading}
                          >
                            {isSignatureUploading
                              ? "Saving…"
                              : "Save signature"}
                          </Button>
                        </div>
                      </div>
                    )}

                  {/* UPLOAD MODE */}
                  {signatureMethod === "upload" &&
                    !formData.declaration.signatureType && (
                      <div className="border rounded-lg p-4 space-y-4 bg-white">
                        <Label className="font-medium text-sm">
                          Upload your signature file
                        </Label>

                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <input
                            id="signatureUpload"
                            type="file"
                            accept=".png,.jpg,.jpeg,.pdf"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          <label
                            htmlFor="signatureUpload"
                            className="cursor-pointer block"
                          >
                            <p className="text-blue-600 font-medium text-sm">
                              Click to upload
                            </p>
                            <p className="text-xs text-gray-500">
                              PNG, JPG or PDF (max 5MB)
                            </p>
                          </label>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSignatureMethod(null);
                            clearSignature();
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}

                  {/* SIGNATURE PREVIEW */}
                  {(formData.declaration.signatureType === "drawn" ||
                    formData.declaration.signatureType === "uploaded") && (
                    <div className="border rounded-lg p-4 space-y-4 bg-white">
                      <Label className="font-medium text-sm">
                        Signature saved
                      </Label>

                      {signaturePreview && (
                        <div className="bg-white border rounded-lg p-4 flex justify-center">
                          <img
                            src={signaturePreview}
                            alt="Signature preview"
                            className="max-h-32"
                          />
                        </div>
                      )}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          clearSignature();
                          setSignatureMethod(null);
                        }}
                      >
                        Change signature
                      </Button>

                      <p className="text-xs text-green-600">
                        ✓ Signature saved
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-4 pt-6 border-t">
            {currentStep > 0 && (
              <Button type="button" onClick={prevStep} variant="outline">
                Previous
              </Button>
            )}

            <div className="ml-auto flex gap-4">
              {currentStep < FORM_STEPS.length - 1 ? (
                <Button type="button" onClick={nextStep}>
                  Next
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={(e) => handleSubmit(e as any)}
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Submitting..."
                    : "Submit Hong Kong Incorporation"}
                </Button>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Your progress is automatically saved as you type.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

function getJurisdictionName(jurisdictionCode: string | null): string {
  if (!jurisdictionCode) return "Hong Kong";

  const jurisdictions: { [key: string]: string } = {
    hongkong: "Hong Kong",
    HONGKONG: "Hong Kong",
    HK: "Hong Kong",
  };

  return jurisdictions[jurisdictionCode] || "Hong Kong";
}
