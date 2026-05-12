# 검사기준서 관리 기능 설계 스펙

## 개요

검사관리 메뉴에 **검사기준서 관리** 기능을 추가한다. 공급업체 + 품목 복합 키로 검사 항목(특성명, 규격, 검사방법 등)을 정의하고, IQC/IPQC/FQC/OQC 실제 수행 시 해당 기준서를 자동으로 불러와 검사결과 항목을 채워준다.

---

## 1. 데이터 모델

### 1.1 QMS_INSPECTION_STANDARD (기준서 헤더)

| 필드 | 타입 | 설명 |
|------|------|------|
| `standardId` | UUID (PK) | 기준서 고유 ID |
| `standardNo` | VARCHAR(50) UNIQUE | 기준서 번호 (IS-YYYY-NNNNN, 서버 자동채번) |
| `supplierCode` | VARCHAR(50) | 공급업체 코드 (복합 비즈니스 키 ①) |
| `supplierName` | VARCHAR(200) | 공급업체명 |
| `itemCode` | VARCHAR(50) | 품목 코드 (복합 비즈니스 키 ②) |
| `itemName` | VARCHAR(200) | 품목명 |
| `version` | INT | 버전 번호 (1부터 자동 증가) |
| `status` | ENUM | DRAFT / ACTIVE / SUPERSEDED / INACTIVE |
| `effectiveDate` | DATE | 적용 시작일 |
| `expiryDate` | DATE nullable | 만료일 (null = 무기한) |
| `approvedBy` | VARCHAR(100) nullable | 승인자 |
| `approvedDate` | DATE nullable | 승인일 |
| `remarks` | VARCHAR(2000) nullable | 비고 |
| `createdAt` / `updatedAt` / `deletedAt` | TIMESTAMP | 공통 감사 필드 |
| `createdBy` / `updatedBy` | VARCHAR(100) | 공통 작성자 필드 |

**비즈니스 규칙:**
- 동일 `(supplierCode, itemCode)` 조합에 ACTIVE 기준서는 최대 1개
- `activate` 호출 시 기존 ACTIVE 기준서는 자동으로 SUPERSEDED 처리
- 버전 번호는 동일 `(supplierCode, itemCode)` 내 이전 최대 버전 + 1로 서버에서 채번

### 1.2 QMS_INSPECTION_STANDARD_ITEM (기준서 항목)

| 필드 | 타입 | 설명 |
|------|------|------|
| `standardItemId` | UUID (PK) | 항목 ID |
| `standardId` | UUID (FK) | 기준서 ID |
| `sequenceNo` | INT | 순번 |
| `characteristicName` | VARCHAR(200) | 특성명 (치수A, 외관, 재질 등) |
| `characteristicNo` | VARCHAR(50) nullable | 특성 번호 (도면 참조) |
| `applicableTypes` | VARCHAR(100) nullable | 적용 검사 유형 (JSON 배열 문자열: `["IQC","FQC"]`, null = 전체 적용) |
| `inputType` | ENUM | NONE / NUMERIC / ATTACHMENT / TEXT |
| `specMin` | DECIMAL(18,6) nullable | 규격 하한 (inputType=NUMERIC일 때 유효) |
| `specMax` | DECIMAL(18,6) nullable | 규격 상한 (inputType=NUMERIC일 때 유효) |
| `specText` | VARCHAR(500) nullable | 규격 텍스트 (inputType=TEXT일 때 기준 표시용) |
| `unit` | VARCHAR(20) nullable | 단위 (mm, kg 등) |
| `isCritical` | BOOLEAN | 중요 특성 여부 (기본 false) |
| `inspectionMethod` | VARCHAR(200) nullable | 검사 방법 |
| `inspectionEquipment` | VARCHAR(200) nullable | 검사 장비 |
| `samplingLevel` | VARCHAR(20) nullable | 샘플링 수준 (II, S-1 등) |
| `aqlLevel` | VARCHAR(20) nullable | AQL 값 (0.65, 1.0, 2.5 등) |
| `remarks` | VARCHAR(2000) nullable | 비고 |
| `createdAt` / `updatedAt` / `deletedAt` | TIMESTAMP | 공통 감사 필드 |
| `createdBy` / `updatedBy` | VARCHAR(100) | 공통 작성자 필드 |

**입력구분(inputType) 동작 정의:**

| 값 | 라벨 | 실제 검사 시 동작 |
|----|------|-----------------|
| `NONE` | 미입력 | 결과 입력 불필요 (OK/NG 체크만) |
| `NUMERIC` | 수치값 | 숫자 입력 → specMin/Max로 자동 합불 판정 |
| `ATTACHMENT` | 첨부파일 | 파일 업로드 필드 표시 |
| `TEXT` | 텍스트입력 | 자유 텍스트 입력 필드 표시 |

---

## 2. API 설계

### 2.1 모듈 위치
`apps/backend/src/modules/inspection-standard/`

### 2.2 엔드포인트

| Method | URL | 설명 |
|--------|-----|------|
| `GET` | `/inspection-standards` | 목록 조회 (supplierCode, itemCode, status, page, limit 필터) |
| `POST` | `/inspection-standards` | 기준서 신규 등록 (status=DRAFT, version=1 또는 자동채번) |
| `GET` | `/inspection-standards/:id` | 기준서 상세 (헤더 + 항목 목록) |
| `PUT` | `/inspection-standards/:id` | 기준서 헤더 수정 (DRAFT 상태만 허용) |
| `POST` | `/inspection-standards/:id/activate` | DRAFT → ACTIVE 전환 (기존 ACTIVE → SUPERSEDED) |
| `POST` | `/inspection-standards/:id/new-version` | 새 버전 생성 (현재 버전 항목 포함 복사 → DRAFT) |
| `POST` | `/inspection-standards/:id/items` | 항목 추가 |
| `PUT` | `/inspection-standards/:id/items/:itemId` | 항목 수정 |
| `DELETE` | `/inspection-standards/:id/items/:itemId` | 항목 삭제 (소프트 삭제) |
| `GET` | `/inspection-standards/active` | supplierCode+itemCode+inspectionType으로 ACTIVE 기준서 항목 조회 (자동 불러오기용) |

### 2.3 자동 불러오기 흐름

```
IQC/IPQC/FQC/OQC 새 로트 생성 폼
  → 사용자가 supplierCode + itemCode 입력 후 [기준서 불러오기] 클릭
  → GET /inspection-standards/active?supplierCode=X&itemCode=Y&inspectionType=IQC
  → applicableTypes가 null이거나 inspectionType을 포함하는 항목만 반환
  → 반환된 항목들이 InspectionResult 입력 폼에 자동 채워짐
  → 사용자는 실측값만 입력
```

---

## 3. 프론트엔드 화면 구성

### 3.1 파일 구조

```
apps/frontend/src/
  app/(dashboard)/inspection/standards/
    page.tsx                              # 기준서 관리 페이지
  components/inspection-standard/
    index.ts
    inspection-standard-page-content.tsx  # 메인 페이지 컨텐츠
    inspection-standard-form.tsx          # 기준서 헤더 등록/수정 폼
    inspection-standard-item-form.tsx     # 항목 추가/수정 폼
    inspection-standard-table.tsx         # 기준서 목록 테이블
    inspection-standard-detail.tsx        # 상세 패널
  stores/
    inspection-standard-store.ts          # Zustand 스토어
  types/
    inspection-standard.ts                # 타입 정의
```

### 3.2 사이드바 변경

`검사관리` 그룹에 항목 추가:
```
검사관리
  ├── 수입검사 (IQC)
  ├── 공정검사 (IPQC)
  ├── 최종검사 (FQC)
  ├── 출하검사 (OQC)
  └── 검사기준서 관리  (isMvp: true, href: /inspection/standards)
```

### 3.3 기준서 관리 페이지 (`/inspection/standards`)

**레이아웃:**
1. 페이지 헤더 + [+ 새 기준서] 버튼
2. 검색 필터 (공급업체코드, 품목코드, 상태)
3. 기준서 목록 테이블
4. 행 클릭 → 상세 패널 (우측 슬라이드)

**목록 테이블 컬럼:**
- 기준서번호 | 공급업체 | 품목코드 | 품목명 | 버전 | 상태 | 적용일 | 승인자 | 항목수

**상태 배지:**
- DRAFT: 회색
- ACTIVE: 초록
- SUPERSEDED: 노랑
- INACTIVE: 빨강

**상세 패널 구성:**
- 기준서 헤더 정보
- 액션 버튼: [승인] (DRAFT→ACTIVE) | [새버전] | [수정] (DRAFT만)
- 검사항목 테이블 + [+ 항목추가] 버튼
- 항목 행: 순번 | 특성명 | 입력구분 | 규격 | 적용유형 | 중요 | 검사방법 | [수정][삭제]

### 3.4 IQC/IPQC/FQC/OQC 연계 변경

`InspectionForm` 컴포넌트에 `[기준서 불러오기]` 버튼 추가:
- 품목코드 + 공급업체코드 입력 후 활성화
- 클릭 시 해당 검사유형에 맞는 기준서 항목을 InspectionResultInput에 자동 채움
- inputType에 따라 입력 필드 유형 다르게 렌더링

---

## 4. 기술 스택

- **Backend**: NestJS, Prisma ORM, PostgreSQL
- **Frontend**: Next.js 15 (App Router), Zustand, Tailwind CSS, shadcn/ui 패턴
- **패턴**: 기존 inspection 모듈 패턴 동일하게 따름 (entity → service → controller → dto)

---

## 5. 개발 범위 요약

| 작업 | 대상 |
|------|------|
| DB 스키마 추가 | Prisma schema + migration |
| Backend 모듈 신규 | inspection-standard (controller, service, module, dto, entity) |
| Backend 연계 수정 | inspection.service - active 기준서 조회 API |
| Frontend 타입 | `types/inspection-standard.ts` |
| Frontend 스토어 | `stores/inspection-standard-store.ts` |
| Frontend 컴포넌트 | inspection-standard 컴포넌트 4개 |
| Frontend 페이지 | `/inspection/standards/page.tsx` |
| Frontend 사이드바 | sidebar.tsx 메뉴 항목 추가 |
| Frontend 연계 수정 | `InspectionForm` - 기준서 불러오기 버튼 추가 |
