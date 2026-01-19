
import { Product, PregnancyStage } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: '아워팜 안심 활성형 엽산 800',
    images: ['https://picsum.photos/seed/folic/300/300'],
    price: 35000,
    storage: '상온',
    usage: '1일 1회 1정 식사 직후',
    isActive: true,
    expirationDate: '2026-12-31',
    pillType: 'round-white',
    ingredients: [{ name: '엽산', amount: 800, unit: '㎍' }, { name: '비타민D', amount: 1000, unit: 'IU' }]
  },
  {
    id: '2',
    name: '활성형 엽산 620',
    images: ['https://picsum.photos/seed/folic2/300/300'],
    price: 30000,
    storage: '상온',
    usage: '1일 1회 1정 식사 직후',
    isActive: true,
    expirationDate: '2026-06-30',
    pillType: 'round-white',
    ingredients: [{ name: '엽산', amount: 620, unit: '㎍' }]
  },
  {
    id: '3',
    name: '식물성 rTG 오메가3 600',
    images: ['https://picsum.photos/seed/omega600/300/300'],
    price: 45000,
    storage: '상온',
    usage: '1일 1회 1캡슐 식사 직후',
    isActive: true,
    expirationDate: '2025-11-20',
    pillType: 'oval-yellow',
    ingredients: [{ name: '오메가3', amount: 600, unit: 'mg' }]
  },
  {
    id: '3-2',
    name: '식물성 rTG 오메가3 900',
    images: ['https://picsum.photos/seed/omega900/300/300'],
    price: 55000,
    storage: '상온',
    usage: '1일 1회 2캡슐 식사 직후',
    isActive: true,
    expirationDate: '2026-01-15',
    pillType: 'oval-yellow',
    ingredients: [{ name: '오메가3', amount: 900, unit: 'mg' }]
  },
  {
    id: '4',
    name: '일반 rTG 오메가3 1000',
    images: ['https://picsum.photos/seed/omega1000/300/300'],
    price: 38000,
    storage: '상온',
    usage: '1일 1회 1캡슐 식사 직후',
    isActive: true,
    expirationDate: '2025-10-30',
    pillType: 'capsule-brown',
    ingredients: [{ name: '오메가3', amount: 1000, unit: 'mg' }]
  },
  {
    id: '5',
    name: '비타민D3 2000IU',
    images: ['https://picsum.photos/seed/vitd2000/300/300'],
    price: 28000,
    storage: '상온',
    usage: '1일 1회 1정 식사 직후',
    isActive: true,
    expirationDate: '2026-12-01',
    pillType: 'small-round',
    ingredients: [{ name: '비타민D', amount: 2000, unit: 'IU' }]
  },
  {
    id: '5-1',
    name: '비타민D 1000IU',
    images: ['https://picsum.photos/seed/vitd1000/300/300'],
    price: 18000,
    storage: '상온',
    usage: '1일 1회 1정 식사 직후',
    isActive: true,
    expirationDate: '2026-11-01',
    pillType: 'small-round',
    ingredients: [{ name: '비타민D', amount: 1000, unit: 'IU' }]
  },
  {
    id: '6-1',
    name: '철분 24mg (Hemo)',
    images: ['https://picsum.photos/seed/iron24/300/300'],
    price: 35000,
    storage: '상온',
    usage: '1일 1회 1정 공복',
    isActive: true,
    expirationDate: '2026-09-15',
    pillType: 'capsule-brown',
    ingredients: [{ name: '철분', amount: 24, unit: 'mg' }]
  },
  {
    id: '7',
    name: '칼마디 복합제 (칼슘 300mg)',
    images: ['https://picsum.photos/seed/calmady/300/300'],
    price: 42000,
    storage: '상온',
    usage: '1일 1회 2정 저녁 식후',
    isActive: true,
    expirationDate: '2027-01-10',
    pillType: 'round-white',
    ingredients: [
      { name: '칼슘', amount: 300, unit: 'mg' },
      { name: '마그네슘', amount: 150, unit: 'mg' },
      { name: '비타민D', amount: 400, unit: 'IU' }
    ]
  },
  {
    id: '8',
    name: '코엔자임 Q10 100mg',
    images: ['https://picsum.photos/seed/coq10/300/300'],
    price: 40000,
    storage: '상온',
    usage: '1일 1회 1캡슐 식후',
    isActive: true,
    expirationDate: '2026-05-15',
    pillType: 'capsule-brown',
    ingredients: [{ name: '코큐텐', amount: 100, unit: 'mg' }]
  },
  {
    id: '9',
    name: '비타민C 1000mg',
    images: ['https://picsum.photos/seed/vitc/300/300'],
    price: 15000,
    storage: '상온',
    usage: '1일 1회 1정 식후',
    isActive: true,
    expirationDate: '2026-08-20',
    pillType: 'round-white',
    ingredients: [{ name: '비타민C', amount: 1000, unit: 'mg' }]
  },
  {
    id: '10',
    name: '안심 차전자피 식이섬유',
    images: ['https://picsum.photos/seed/fiber/300/300'],
    price: 28000,
    storage: '상온',
    usage: '1일 1회 1포 물과 함께',
    isActive: true,
    expirationDate: '2026-05-20',
    pillType: 'powder-pack',
    ingredients: [{ name: '차전자피', amount: 5000, unit: 'mg' }]
  },
  {
    id: '11',
    name: '고순도 마그네슘 350mg',
    images: ['https://picsum.photos/seed/mag/300/300'],
    price: 32000,
    storage: '상온',
    usage: '1일 1회 1정 저녁 복용',
    isActive: true,
    expirationDate: '2026-11-10',
    pillType: 'round-white',
    ingredients: [{ name: '마그네슘', amount: 350, unit: 'mg' }]
  }
];

export const LEGAL_CONSENT_TEXT = `[개인정보 수집 및 이용 동의서]

아이맘약국은 맞춤형 건강기능식품 상담 및 소분 판매 서비스를 제공하기 위해 아래와 같이 개인정보를 수집 및 이용하고자 합니다.

1. 수집 항목: 성명, 연락처, 주소, 연령대, 임신 단계, 혈액검사 결과(비타민D, Hb), 건강 상태 및 증상 등
2. 수집 목적: 맞춤형 영양제 상담, 제품 추천, 소분 판매 기록 관리(법정 3년 보관), 맞춤 영양 설계 서비스 제공
3. 보유 및 이용 기간: 상담 및 판매일로부터 3년 (법령 및 운영 정책에 따른 보관 의무 준수)
4. 동의 거부 권리: 귀하는 동의를 거부할 권리가 있으나, 거부 시 개인 맞춤형 상담 서비스 이용이 제한될 수 있습니다.

본인은 위와 같은 개인정보 및 민감정보(건강정보 등) 수집·이용에 동의하며, 관계 법령을 준수함에 동의합니다.`;

export const COMMON_NOTICE = "건강기능식품은 소분 시 습도와 온도에 민감하므로 1개월 단위로 구입하는 것을 권장하며, 개봉/소분 후에는 2개월 이내 복용을 권장합니다.";
export const DISCLAIMER = "본 서비스는 상담을 위한 참고용이며, 질병의 진단 및 치료를 목적으로 하지 않습니다.";
