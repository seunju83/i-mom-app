
export enum PregnancyStage {
  PREP = '임신 준비기',
  EARLY = '임신 초기 (4주~15주)',
  MID = '임신 중기 (16주~27주)',
  LATE = '임신 후기 (28주~40주)',
  LACT = '출산 후 수유기'
}

export enum AgeGroup {
  TWENTIES = '20대',
  THIRTIES = '30대',
  FORTIES_PLUS = '40대 이상'
}

export enum BloodTestResult {
  DEFICIENT = '결핍',
  INSUFFICIENT = '부족',
  NORMAL = '정상',
  UNKNOWN = '모름'
}

export enum HbLevel {
  LEVEL_1 = '9 이하',
  LEVEL_2 = '10~11',
  LEVEL_3 = '12 이상(정상)',
  UNKNOWN = '모름'
}

export enum Symptom {
  DIZZINESS = '어지러움',
  CRAMPS = '다리에 쥐가 남',
  CONSTIPATION = '변비',
  MORNING_SICKNESS = '입덧이 심해 위장장애가 걱정됨',
  TWINS = '쌍둥이(다태아)',
  BLEEDING = '출혈 있음',
  NONE = '해당 없음'
}

export interface IngredientInfo {
  name: string;
  amount: number;
  unit: string;
}

export type PillType = 'round-white' | 'oval-yellow' | 'capsule-brown' | 'small-round' | 'powder-pack';

export interface Product {
  id: string;
  name: string;
  images: string[];
  price: number;
  storage: '상온' | '냉장';
  usage: string;
  ingredients: IngredientInfo[];
  isActive: boolean;
  expirationDate: string;
  pillType?: PillType;
  descriptionUrl?: string;
}

export interface SurveyData {
  customerName: string;
  phone: string;
  email: string;
  ageGroup: AgeGroup;
  isOver35: boolean;
  address?: string;
  stage: PregnancyStage;
  currentSupplements: string[];
  vitaminDLevel: BloodTestResult;
  hbLevel: HbLevel;
  symptoms: Symptom[];
  notes: string;
  pharmacistName: string;
}

export interface ConsultationRecord {
  id: string;
  date: string;
  pharmacistName: string;
  customerName: string;
  surveyData: SurveyData;
  recommendedProductNames: string[];
  selectedProducts: Product[];
  totalPrice: number;
  purchaseStatus: '구매 완료' | '상담만 진행';
  counselingMethod: string;
  dispensingDays: number;
}

export interface Pharmacist {
  id: string;
  name: string;
  isActive: boolean;
}

export interface PharmacyConfig {
  pharmacyName: string;
  currentPharmacistId: string;
  businessAddress: string;
  managerName: string;
}
