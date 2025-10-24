-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "client_onboardings" (
    "id" TEXT NOT NULL,
    "gender" TEXT,
    "phoneNumber" TEXT,
    "personalEmail" TEXT,
    "residentialAddress" TEXT,
    "nationality" TEXT,
    "passportNumber" TEXT,
    "passportExpiryDate" TEXT,
    "dateOfBirth" TEXT,
    "taxResidency" TEXT,
    "taxIdentificationNumber" TEXT,
    "projectName" TEXT,
    "projectEmail" TEXT,
    "passportCopy" TEXT,
    "proofOfAddress" TEXT,
    "bankStatement" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_onboardings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_incorporations" (
    "id" TEXT NOT NULL,
    "onboardingId" TEXT NOT NULL,
    "jurisdiction" TEXT,
    "companyNames" JSONB NOT NULL,
    "relevantIndividuals" JSONB NOT NULL,
    "sourceOfFunds" JSONB NOT NULL,
    "recordsLocation" JSONB NOT NULL,
    "declaration" JSONB NOT NULL,
    "requiresNomineeShareholder" BOOLEAN NOT NULL DEFAULT false,
    "shareholders" JSONB NOT NULL,
    "requiresNomineeDirector" BOOLEAN NOT NULL DEFAULT false,
    "directors" JSONB NOT NULL,
    "purposeOfCompany" TEXT,
    "geographicProfile" TEXT,
    "authorizedShares" TEXT,
    "sharesParValue" TEXT,
    "currency" TEXT DEFAULT 'USD',
    "customShares" TEXT,
    "customParValue" TEXT,
    "complexStructureNotes" TEXT,
    "orderSeal" BOOLEAN NOT NULL DEFAULT true,
    "sealQuantity" TEXT NOT NULL DEFAULT '1',
    "signatureType" TEXT,
    "signatureFilePath" TEXT,
    "signatureFileName" TEXT,
    "completedByName" TEXT,
    "signedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_incorporations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "company_incorporations_onboardingId_key" ON "company_incorporations"("onboardingId");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_onboardings" ADD CONSTRAINT "client_onboardings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_incorporations" ADD CONSTRAINT "company_incorporations_onboardingId_fkey" FOREIGN KEY ("onboardingId") REFERENCES "client_onboardings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
