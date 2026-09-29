# 지역명 검수표 — V161-A (자동 변환·검수 대기)

`scripts/v161/build-region-names-v161.mjs`가 생성한다. 손으로 고치지 말고 사전·규칙을 고친 뒤 다시 생성한다.

## 규칙
- 표기: `한글명 (현지명)` — 현지명은 원자료 표기 그대로(성조·특수문자 보존), 한글명과 같으면 괄호 생략. 지도 라벨은 한글만.
- 한글명 결정 순서: ① 플랫폼 사전 ② 외교부·국립국어원 확인분 ③ 국립국어원 베트남어 표기 규칙 자동 변환(`pending`) ④ 변환 불가 → 현지명만.
- 베트남 개편 전 63개 성·개편 후 34개 단위·주요 도시 6곳은 ①에서 100% 결정한다(자동 변환 0).
- 자동 변환 규칙의 정확도: 사전 이름 97개(63 + 34)를 규칙으로 변환해 사전과 비교 — 97/97 일치(`vietnamese-hangul-v161.test.mjs`).

## 요약
- 베트남 사전: 34개 단위 34 · 도시 6 · 63개 성 63
- 베트남 팩 지명 필드 값의 사전 적중: 277775건(34개 단위 이름으로 146266 · 63개 성 이름으로 131509 — 도시 이름은 같은 이름의 34개 단위로 먼저 판정)
- 자동 변환(검수 대기) 85개 · 원문 그대로 표시 342개(베트남어 음절 아님 35 · 부호 없는 원문 69 · 사전 이름 오기 의심 27 · 서술·목록형 211)
- 방글라데시: 주 8(확인) · 구 64(주와 같은 이름 8개 확인, 나머지 검수 대기)

## 1. 베트남 — 자동 변환 제안(검수 대기)
화면에는 제안 한글명이 `한글명 (현지명)`으로 표시된다. 틀린 제안은 사전(① 또는 ②)에 올바른 표기를 넣어 바로잡는다.

| 현지명(원문) | 제안 한글명 | 빈도 | 요소 | 필드 | 비고 |
|---|---|---|---|---|---|
| Mê Linh | 멜린 | 7 | B-012 | 행정구역_GADM_매칭 |  |
| Bình Xuyên | 빈쑤옌 | 6 | B-012 | 행정구역_GADM_매칭 |  |
| Lập Thạch | 럽타익 | 6 | B-012 | 행정구역_GADM_매칭 |  |
| Phúc Yên | 푹옌 | 6 | B-012 | 행정구역_GADM_매칭 |  |
| Sông Lô | 송로 | 6 | B-012 | 행정구역_GADM_매칭 |  |
| Tam Đảo | 땀다오 | 6 | B-012 | 행정구역_GADM_매칭 |  |
| Tam Dương | 땀즈엉 | 6 | B-012 | 행정구역_GADM_매칭 |  |
| Vĩnh Tường | 빈뜨엉 | 6 | B-012 | 행정구역_GADM_매칭 |  |
| Vĩnh Yên | 빈옌 | 6 | B-012 | 행정구역_GADM_매칭 |  |
| Yên Lạc | 옌락 | 6 | B-012 | 행정구역_GADM_매칭 |  |
| Ba Đình | 바딘 | 3 | B-012 | 행정구역_GADM_매칭 |  |
| Bắc Từ Liêm | 박뜰리엠 | 3 | B-012 | 행정구역_GADM_매칭 |  |
| Gia Lâm | 잘럼 | 3 | B-012 | 행정구역_GADM_매칭 |  |
| Hai Bà Trưng | 하이바쯩 | 3 | B-012 | 행정구역_GADM_매칭 |  |
| Hoàn Kiếm | 호안끼엠 | 3 | B-012 | 행정구역_GADM_매칭 |  |
| Hoàng Mai | 호앙마이 | 3 | B-012 | 행정구역_GADM_매칭 |  |
| Long Biên | 롱비엔 | 3 | B-012 | 행정구역_GADM_매칭 |  |
| Nam Từ Liêm | 남뜰리엠 | 3 | B-012 | 행정구역_GADM_매칭 |  |
| Sóc Sơn | 속선 | 3 | B-012 | 행정구역_GADM_매칭 |  |
| Tây Hồ | 떠이호 | 3 | B-012 | 행정구역_GADM_매칭 |  |
| Thanh Trì | 타인찌 | 3 | B-012 | 행정구역_GADM_매칭 |  |
| Thanh Xuân | 타인쑤언 | 3 | B-012 | 행정구역_GADM_매칭 |  |
| Bát Xát | 밧쌋 | 2 | B-012 | 행정구역_GADM_매칭 |  |
| Cẩm Xuyên | 껌쑤옌 | 2 | B-012 | 행정구역_GADM_매칭 |  |
| Cầu Giấy | 꺼우저이 | 2 | B-012 | 행정구역_GADM_매칭 |  |
| Ba Đồn | 바돈 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Bắc Mê | 박메 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Bắc Trà My | 박짜미 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Bắc Yên | 박옌 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Bảo Lâm | 바올럼 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Bảo Thắng | 바오탕 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Bình Sơn | 빈선 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Bố Trạch | 보짜익 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Cam Lộ | 깜로 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Cầu Gi | 꺼우기 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Chương Mỹ | 쯔엉미 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Đốn | 돈 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Đông Anh | 동아인 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Đống Đa | 동다 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Đông Triều | 동찌에우 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Đức Phổ | 득포 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Đức Thọ | 득토 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Giao Thủy | 자오투이 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Gò Công | 고꽁 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Hải Lăng | 하일랑 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Hoành Bồ | 호안보 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Hương Khê | 흐엉케 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Hương Sơn | 흐엉선 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Kiến Tường | 끼엔뜨엉 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Kỳ Anh | 끼아인 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Lệ Thủy | 레투이 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Mai Sơn | 마이선 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Minh Hóa | 민호아 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Mộc Hóa | 목호아 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Móng Cái | 몽까이 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Mường Khương | 므엉크엉 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Mỹ Tho | 미토 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Nghĩa Hành | 응이아하인 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Nghĩa Lộ | 응이알로 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Núi Thành | 누이타인 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Phong Điền | 퐁디엔 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Phú Lộc | 풀록 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Phú Ninh | 푸닌 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Quảng Trạch | 꽝짜익 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Rạch Giá | 라익자 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Sơn Hà | 선하 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Sông Mã | 송마 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Tam Kỳ | 땀끼 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Tân Hưng | 떤흥 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Thạch Hà | 타익하 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Thăng Bình | 탕빈 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Thủ Đức | 투득 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Tiên Yên | 띠엔옌 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Trạm Tấu | 짬떠우 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Trần Văn Thời | 쩐반터이 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Trấn Yên | 쩐옌 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Tuy Đức | 뚜이득 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Tuyên Hóa | 뚜옌호아 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Văn Bàn | 반반 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Vị Xuyên | 비쑤옌 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Vĩnh Hưng | 빈흥 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Vĩnh Linh | 빈린 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Vũ Quang | 부꽝 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Yên Châu | 옌쩌우 | 1 | B-012 | 행정구역_GADM_매칭 |  |
| Yên Minh | 옌민 | 1 | B-012 | 행정구역_GADM_매칭 |  |

## 2. 베트남 — 원문 그대로 표시(한글명 없음)
추정하지 않는다. '부호 없는 원문'의 제안은 검수용일 뿐 화면에 쓰지 않는다. '사전 이름 오기 의심'은 원자료 표기를 확인한 뒤 사전 변형으로 올릴 수 있다.

| 분류 | 원문 | 제안(화면 미사용) | 빈도 | 요소 | 필드 | 사유 |
|---|---|---|---|---|---|---|
| 베트남어 음절 아님 | Central |  | 3 | B-012 | 발생지역_원문 | not a Vietnamese syllable: Central |
| 베트남어 음절 아님 | Northern |  | 3 | B-012 | 발생지역_원문 | not a Vietnamese syllable: Northern |
| 베트남어 음절 아님 | YênB |  | 3 | B-012 | 행정구역_GADM_매칭 | not a Vietnamese syllable: B |
| 베트남어 음절 아님 | Đắk R'Lấp |  | 2 | B-012 | 발생지역_원문, 행정구역_GADM_매칭 | not a Vietnamese syllable: R'Lấp |
| 베트남어 음절 아님 | Mekong delta |  | 2 | B-012 | 발생지역_원문 | not a Vietnamese syllable: Mekong |
| 베트남어 음절 아님 | Singapore |  | 2 | E-006 | city | not a Vietnamese syllable: Singapore |
| 베트남어 음절 아님 | Between Thua Thien Hue |  | 1 | B-012 | 발생지역_원문 | not a Vietnamese syllable: Between |
| 베트남어 음절 아님 | Bihn Nguyen |  | 1 | D-025 | 위치 | not a Vietnamese syllable: Bihn |
| 베트남어 음절 아님 | Central - North regions |  | 1 | B-012 | 발생지역_원문 | not a Vietnamese syllable: Central |
| 베트남어 음절 아님 | Central Eastern Coast |  | 1 | B-012 | 발생지역_원문 | not a Vietnamese syllable: Central |
| 베트남어 음절 아님 | central regions |  | 1 | B-012 | 발생지역_원문 | not a Vietnamese syllable: central |
| 베트남어 음절 아님 | China sea coast |  | 1 | B-012 | 발생지역_원문 | not a Vietnamese syllable: China |
| 베트남어 음절 아님 | Dam Site |  | 1 | C-025 | 속성20_지역_원문 | not a Vietnamese syllable: Site |
| 베트남어 음절 아님 | Golfe du Tonkin |  | 1 | B-012 | 발생지역_원문 | not a Vietnamese syllable: Golfe |
| 베트남어 음절 아님 | Kegalle |  | 1 | B-012 | 발생지역_원문 | not a Vietnamese syllable: Kegalle |
| 베트남어 음절 아님 | L?ng S?n |  | 1 | B-012 | 발생지역_원문 | not a Vietnamese syllable: L?ng |
| 베트남어 음절 아님 | London |  | 1 | E-006 | city | not a Vietnamese syllable: London |
| 베트남어 음절 아님 | Manila |  | 1 | E-006 | city | not a Vietnamese syllable: Manila |
| 베트남어 음절 아님 | Near Cambodia border |  | 1 | B-012 | 발생지역_원문 | not a Vietnamese syllable: Near |
| 베트남어 음절 아님 | Ngh?a L? Town) |  | 1 | B-012 | 발생지역_원문 | not a Vietnamese syllable: Ngh?a |
| 베트남어 음절 아님 | Nhon Hoi Economic Zone |  | 1 | D-025 | 위치 | not a Vietnamese syllable: Economic |
| 베트남어 음절 아님 | Nong Son districts) |  | 1 | B-012 | 발생지역_원문 | not a Vietnamese syllable: districts |
| 베트남어 음절 아님 | North |  | 1 | B-012 | 발생지역_원문 | not a Vietnamese syllable: North |
| 베트남어 음절 아님 | Paris |  | 1 | E-006 | city | not a Vietnamese syllable: Paris |
| 베트남어 음절 아님 | Phu Khahu Provinces |  | 1 | B-012 | 발생지역_원문 | not a Vietnamese syllable: Khahu |
| 베트남어 음절 아님 | Quanq Bin |  | 1 | B-012 | 발생지역_원문 | not a Vietnamese syllable: Quanq |
| 베트남어 음절 아님 | S?c Tr?ng Province |  | 1 | D-025 | 위치 | not a Vietnamese syllable: S?c |
| 베트남어 음절 아님 | South |  | 1 | B-012 | 발생지역_원문 | not a Vietnamese syllable: South |
| 베트남어 음절 아님 | South Vietnam |  | 1 | D-025 | 위치 | not a Vietnamese syllable: South |
| 베트남어 음절 아님 | Southern coast |  | 1 | B-012 | 발생지역_원문 | not a Vietnamese syllable: Southern |
| 베트남어 음절 아님 | Thanh Hoa provi |  | 1 | D-025 | 위치 | not a Vietnamese syllable: provi |
| 베트남어 음절 아님 | Tr |  | 1 | B-012 | 행정구역_GADM_매칭 | not a Vietnamese syllable: Tr |
| 베트남어 음절 아님 | Tr?m T?u districts |  | 1 | B-012 | 발생지역_원문 | not a Vietnamese syllable: Tr?m |
| 베트남어 음절 아님 | Vietnam nation-wide |  | 1 | D-025 | 위치 | not a Vietnamese syllable: Vietnam |
| 베트남어 음절 아님 | Zurich |  | 1 | E-006 | city | not a Vietnamese syllable: Zurich |
| 부호 없는 원문 | Ha Tay | 하따이 | 9 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Nghe Tinh | 응애띤 | 9 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Ha Nam Ninh | 하남닌 | 4 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Quang Nam Da Nang | 꽝남자낭 | 4 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Tuy | 뚜이 | 4 | B-012 | 행정구역_GADM_매칭 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Binh Tri Thien | 빈찌티엔 | 3 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Ha Bac | 하박 | 3 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Ha Son Binh | 하손빈 | 3 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Nghia Binh | 응이아빈 | 3 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Sa Pa | 사빠 | 3 | B-012 | 발생지역_원문, 행정구역_GADM_매칭 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Cam Xuyen | 깜쑤옌 | 2 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Hai Hung | 하이훙 | 2 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Hai Lang | 하일랑 | 2 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Nam Ha | 남하 | 2 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Phu Khanh | 푸카인 | 2 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Trieu Phong | 찌에우퐁 | 2 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Ba Ria | 바리아 | 1 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Bac Yen | 박옌 | 1 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Bao Thang | 바오탕 | 1 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Bao Xat | 바오쌋 | 1 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Binh Hoa | 빈호아 | 1 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Can Duoc | 깐주옥 | 1 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Chong My) | 쫑미 | 1 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Chu Lai | 쭐라이 | 1 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Chuong My | 쭈옹미 | 1 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Cua Lo district) | 꾸얼로 | 1 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Dam | 잠 | 1 | C-025 | 속성20_지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Dong Trieu | 종찌에우 | 1 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Du Tien | 주띠엔 | 1 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Duc Tho) | 죽토 | 1 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Duyen Hai town | 주옌하이 | 1 | D-025 | 위치 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Ha Ham Ninh provinces | 하함닌 | 1 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Ha Thin | 하틴 | 1 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Ha Tuyen | 하뚜옌 | 1 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Hiep Thanh commune | 히엡타인 | 1 | D-025 | 위치 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Hoang Lien Son | 호앙리엔손 | 1 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Huong Son | 후옹손 | 1 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Khanh Hao | 카인하오 | 1 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Kien Kang province | 끼엔깡 | 1 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Ky Anh | 끼아인 | 1 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Le Thuy | 래투이 | 1 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Mai Son | 마이손 | 1 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Minh Hoa) | 민호아 | 1 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Muong Kuon | 무옹꾸온 | 1 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Muong Lay provinces | 무옹라이 | 1 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | My Tho City | 미토 | 1 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Nai Hung | 나이훙 | 1 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Nghe provinces | 응애 | 1 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Nghia Hanh | 응이아하인 | 1 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Ngoc Hien | 응옥히엔 | 1 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Ninh Hai | 닌하이 | 1 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Phong Huy | 퐁후이 | 1 | D-025 | 위치 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Phong Lieu | 퐁리에우 | 1 | D-025 | 위치 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Phong Nguyen | 퐁응우옌 | 1 | D-025 | 위치 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Quang Ninh Hai Phong | 꽝닌하이퐁 | 1 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Quang Trach | 꽝짜익 | 1 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Tan Hung | 딴훙 | 1 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Thach Ha | 타익하 | 1 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Thanh | 타인 | 1 | B-012 | 행정구역_GADM_매칭 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Thua Thien | 투어티엔 | 1 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Thuan Ha provinces | 투언하 | 1 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Tien Yen | 띠엔옌 | 1 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Tram Tau | 짬따우 | 1 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Tuyen Hoa) | 뚜옌호아 | 1 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Tuyen Hoan | 뚜옌호안 | 1 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Vinh Chau town | 빈짜우 | 1 | D-025 | 위치 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Vinh Hung | 빈훙 | 1 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Vu Quang | 부꽝 | 1 | B-012 | 발생지역_원문 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 부호 없는 원문 | Y | 이 | 1 | B-012 | 행정구역_GADM_매칭 | 성조·모음 부호가 없어 제안만 둠(화면은 원문) |
| 사전 이름 오기 의심 | Quang Nam-Da |  | 2 | B-012 | 발생지역_원문 | Quảng Nam(꽝남)의 오기로 보임 — 원자료 확인 필요 |
| 사전 이름 오기 의심 | Than Hoa |  | 2 | B-012 | 발생지역_원문 | Thanh Hóa(타인호아)의 오기로 보임 — 원자료 확인 필요 |
| 사전 이름 오기 의심 | Bihn Thuan |  | 1 | B-012 | 발생지역_원문 | Bình Thuận(빈투언)의 오기로 보임 — 원자료 확인 필요 |
| 사전 이름 오기 의심 | Bin Dinh |  | 1 | B-012 | 발생지역_원문 | Bình Định(빈딘)의 오기로 보임 — 원자료 확인 필요 |
| 사전 이름 오기 의심 | Da Nag Province |  | 1 | B-012 | 발생지역_원문 | Đà Nẵng(다낭)의 오기로 보임 — 원자료 확인 필요 |
| 사전 이름 오기 의심 | Dal Lac provinces |  | 1 | B-012 | 발생지역_원문 | Đắk Lắk(닥락)의 오기로 보임 — 원자료 확인 필요 |
| 사전 이름 오기 의심 | Darlac |  | 1 | B-012 | 발생지역_원문 | Đắk Lắk(닥락)의 오기로 보임 — 원자료 확인 필요 |
| 사전 이름 오기 의심 | Dong Na |  | 1 | B-012 | 발생지역_원문 | Đồng Nai(동나이)의 오기로 보임 — 원자료 확인 필요 |
| 사전 이름 오기 의심 | Giai Lai provinces |  | 1 | B-012 | 발생지역_원문 | Gia Lai(잘라이)의 오기로 보임 — 원자료 확인 필요 |
| 사전 이름 오기 의심 | Guang Ngai |  | 1 | B-012 | 발생지역_원문 | Quảng Ngãi(꽝응아이)의 오기로 보임 — 원자료 확인 필요 |
| 사전 이름 오기 의심 | Guang Ninh provinces |  | 1 | B-012 | 발생지역_원문 | Quảng Ninh(꽝닌)의 오기로 보임 — 원자료 확인 필요 |
| 사전 이름 오기 의심 | Ha Thinh |  | 1 | B-012 | 발생지역_원문 | Hà Tĩnh(하띤)의 오기로 보임 — 원자료 확인 필요 |
| 사전 이름 오기 의심 | Ho Chi Ming City |  | 1 | B-012 | 발생지역_원문 | Hồ Chí Minh(호찌민)의 오기로 보임 — 원자료 확인 필요 |
| 사전 이름 오기 의심 | Hưng |  | 1 | B-012 | 행정구역_GADM_매칭 | Hưng Yên(흥옌)이 잘린 표기로 보임 — 원자료 확인 필요 |
| 사전 이름 오기 의심 | Khan Hoa |  | 1 | B-012 | 발생지역_원문 | Khánh Hòa(카인호아)의 오기로 보임 — 원자료 확인 필요 |
| 사전 이름 오기 의심 | Kien Gang |  | 1 | B-012 | 발생지역_원문 | Kiên Giang(끼엔장)의 오기로 보임 — 원자료 확인 필요 |
| 사전 이름 오기 의심 | Kon Tun provinces |  | 1 | B-012 | 발생지역_원문 | Kon Tum(꼰뚬)의 오기로 보임 — 원자료 확인 필요 |
| 사전 이름 오기 의심 | Minh Luong Commune |  | 1 | B-012 | 발생지역_원문 | Vĩnh Long(빈롱)의 오기로 보임 — 원자료 확인 필요 |
| 사전 이름 오기 의심 | Qu?ng Ninh |  | 1 | B-012 | 발생지역_원문 | Quảng Ninh(꽝닌)의 오기로 보임 — 원자료 확인 필요 |
| 사전 이름 오기 의심 | Quản |  | 1 | B-012 | 행정구역_GADM_매칭 | Quảng Ninh(꽝닌)이 잘린 표기로 보임 — 원자료 확인 필요 |
| 사전 이름 오기 의심 | Quan Binh provinces |  | 1 | B-012 | 발생지역_원문 | Quảng Bình(꽝빈)의 오기로 보임 — 원자료 확인 필요 |
| 사전 이름 오기 의심 | Quảng |  | 1 | B-012 | 행정구역_GADM_매칭 | Quảng Ninh(꽝닌)이 잘린 표기로 보임 — 원자료 확인 필요 |
| 사전 이름 오기 의심 | Quảng Ngã |  | 1 | B-012 | 행정구역_GADM_매칭 | Quảng Ngãi(꽝응아이)이 잘린 표기로 보임 — 원자료 확인 필요 |
| 사전 이름 오기 의심 | Tay Minh |  | 1 | B-012 | 발생지역_원문 | Tây Ninh(떠이닌)의 오기로 보임 — 원자료 확인 필요 |
| 사전 이름 오기 의심 | Thang Binh |  | 1 | B-012 | 발생지역_원문 | Thái Bình(타이빈)의 오기로 보임 — 원자료 확인 필요 |
| 사전 이름 오기 의심 | Tiền Gian |  | 1 | B-012 | 행정구역_GADM_매칭 | Tiền Giang(띠엔장)이 잘린 표기로 보임 — 원자료 확인 필요 |
| 사전 이름 오기 의심 | Vinh Phu |  | 1 | B-012 | 발생지역_원문 | Vĩnh Phúc(빈푹)의 오기로 보임 — 원자료 확인 필요 |
| 서술·목록형 | Bac Yen district, Son La province |  | 3 | C-025, D-025 | 속성20_지역_원문, 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Ba Ria- Vung Tau  provine, Southern Ho Shi Minh City |  | 2 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Binh Thuan Province (south-eastern Vietnam) |  | 2 | B-012, D-025 | 발생지역_원문, 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Coordinates of powerhouse |  | 2 | C-025 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Ha Tinh (Huong Khe |  | 2 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Lai Chau and Dien Bien |  | 2 | C-012, D-025 | 속성20_지역_원문, 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | N.A. on the source |  | 2 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Nam Soi Dam, Muong Cai and Huoi Mot communes, Song Ma district, Son La province, Vietnam |  | 2 | C-025 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Phuoc Minh commune,  province of Ninh Thuan |  | 2 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Quang Tri (Vinh Linh |  | 2 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Yen Bai (Mu Cang Chai district) |  | 2 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | 100 km East from Hanoi |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | 60KM south of Ho Chi Minh city |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | 60KM south of Ho Chi Minh city / Ba Ria Vung Tau Province / Ba Ria, Vung Tau Province |  | 1 | C-012 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | A Luoi district, Thua Thien Hue province, Socialist Republic of Viet Nam |  | 1 | C-025 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Ba Nang Commune, Dak Rong district, Quan / Northern Ha Giang Province, Quang Binh D / Quang Tri Province |  | 1 | C-012 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Ba Nang Commune, Dak Rong district, Quang Tri province |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Bac Giang river in Hung Viet commune, Tr / Thuan Thanh district, Bac Ninh province, |  | 1 | C-012 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Bac Giang river in Hung Viet commune, Trang Dinh district, Bac La commune, Van Lang district and Hon |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Bac Lieu Province (southern Vietnam) |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Bac Lieu province, 200 km Soutwest of HC / Ca Mau Province / Vinh Trach Dong commune, Bac Lieu town, |  | 1 | C-012 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Bac Lieu province, 200 km Soutwest of HCM City |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Bac Me district (Ha Giang province) |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Bac Tra My district (Quang Nam province) |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Bac Van Yen Industrial Cluster in the no / Chay river, in the Bac Ha district of La / Dum River near Lao Cai city |  | 1 | C-012 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Bac Van Yen Industrial Cluster in the northern province of Yen Bai, Vietnam |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Bac Yen district, Son La province / Sop Cop district, Son La province, North / near Chieng Muon and Chieng San communes |  | 1 | C-012 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Baie d'Halong - Quang Ninh Province |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Ban Sai village (Sa Pa district |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Bao Lam and Di Linh districts, Lam Dong  / Binh Thuan province / Binh Thuan province, south-eastern Vietn |  | 1 | C-012 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Bao Lam and Di Linh districts, Lam Dong province |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Bao Lam district (Cao Bang province) |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Bar Maih Commune, Dam site |  | 1 | C-025 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Bat Xat district (Lao Cai province) |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Bat Xat district, Muong Hum and Nam Pung communes Lao Cai province of Viet Nam |  | 1 | C-025 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | BBB Boiler: An Binh Ward, Bien Hoa City, Dong Nai Province |  | 1 | C-025 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | BBT Boiler, Di An District, Binh Duong Province |  | 1 | C-025 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Bien Hoa / Binh Phuoc Province / Dong Nai province |  | 1 | C-012 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Binh Dai district, Ben Tre province |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Binh Dai district, Ben Tre province / Dan Thanh Commune, Duyen Hai District ,  / Thanh Hai commune, Thanh Phu district of |  | 1 | C-012 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Binh Dinh Province / Binh Dinh province, in the Nhon Hoi Econ / Cheo Reo Ward, Ayunpa Town, Gia Lai Prov |  | 1 | C-012 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Binh Dinh province, in the Nhon Hoi Economic Zone |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Binh Dinh province,Vinh Son and Vinh Kim commune, Vinh Thanh district |  | 1 | C-025 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Binh Son district (Quang Ngai); Nui Thanh |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | BMT Boiler, Quy Nhon City, Binh Dinh Province |  | 1 | C-025 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | BPB, Huong Thuy District, Thua Thien-Hue Province |  | 1 | C-025 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Bung River, Ma Cooih commune and Ka Dang commune in Dong Giang |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Cà Mau (Nam Can |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Cai Lan Port in Quang Ninh Province in N / Quang Ninh Province |  | 1 | C-012 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Cam Lo); Quang Ngai |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Cam Ranh districts (Khanh Hoa province) |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Can Giuoc areas (Long An province); U Minh |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Can Tho / Chau Thanh district, Hau Giang province / Mekong Delta province of Sóc Trang |  | 1 | C-012 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Cao Bang (Hoa An district) |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | central province of Binh Dinh, located near Nhon Hoi |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Chay river, in the Bac Ha district of Lao Cai Province in northern Vietnam |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Cheo Reo Ward, Ayunpa Town, Gia Lai Province |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Coc San HPP, Coc San Commune, Bat Xat District, Lao Cai Province |  | 1 | C-025 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Con Dau island, Ba Ria province |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Con river, Vinh Son commune, Binh Dinh province |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Da Lat city, Central Highlands province of Lam Dong |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Da Nang / Phuoc Son, Quang Nam Province / Quang Nam province, Thanh My township, N |  | 1 | C-012 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Da Nang city (Quang Nam Danang province) |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Dac Ngo village (Tuy Duc area |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Dai Tu District, Northern Province Thai |  | 1 | C-012 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Dai Tu District, Northern Province Thai Nguyen |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Dak Glun 2: Quang Tam and Dak Ngo Commune, Tuy Duc District, Dak Nong Province |  | 1 | C-025 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Dak Mi 1 hydro (Power House), Dak Glei District in Kon Tum Province |  | 1 | C-025 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Dak Mi 1A hydro (Power House), Dak Glei District in Kon Tum Province |  | 1 | C-025 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Dak Nghe river, a branch of the Dakbla river, part of the Se San River located in the Ngoc Tem commu |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Dak Nong stream, Dak Nia commune, Gia Nghia town, Dak Nong province |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Dam Doi districts) Provinces |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Dam in Loc Tan commune, Bao Lam district, Phuoc loc commune, Huoai District and Trieu Hai commune, Da Teh district, Lam Dong Province, Socialist Republic of Viet Nam |  | 1 | C-025 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Dam in Tan Van commune, Lam Ha district and Tan Thanh commune, Duc Trong district, Lam Dong Province, Socialist Republic of Viet Nam |  | 1 | C-025 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Dam site: Gia Lai Province,Ia O Commune, Chu Prong District, |  | 1 | C-025 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Dam, Dak Lak province |  | 1 | C-025 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Dam, La Ngau commune, Tanh Linh district, Binh Thuan province |  | 1 | C-025 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Dam, Nam Mu stream, Tan Thanh commune, Bac Quang district, Ha Giang province |  | 1 | C-025 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Dam, Nam Xay Noi stream in Nam Xay and Nam Xe communes, Van Ban district, Lao Cai province |  | 1 | C-025 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Dan Thanh Commune, Duyen Hai District , Tra Vinh Province |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Destination: Phu My Industrial Area, Ho Chi Minh City |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Dong Giang district, Quang Nam province |  | 1 | C-025 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Dong Hai, Duyen Hai district |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Dong Nai river, Dak Sin commune, Dak R'Lap district, Dak Nong province and in Loc Bac commune, Bao L |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Dong Nai river, Di Linh district, Lam Dong province |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Du Gia villages (Yen Minh district |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Duc Pho Districts (Quang Ngai province); Quang Nam |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Duc Tho district, Ha Tinh province / Ha Tinh |  | 1 | C-012 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Dum River near Lao Cai city |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Ea Wi, Ea H’Leo District of Dak Lak Prov / Phu Yen, Hoa Hoi commune |  | 1 | C-012 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Ea Wi, Ea H’Leo District of Dak Lak Province |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Gia Lai province, Po Lang Commune, Mang Yang district (Dam site) |  | 1 | C-025 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Giao Ha villages (Giao Thuy district |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Go Cong Township districts (Tien Giang province) |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Ha Giang province (cascade 1 weir) |  | 1 | C-025 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Ha Noi (Nam Hai |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Ha Noi city (Nhà Xanh Market in Câu Giây District) |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Ha Tuyen (Cao Bang province) |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Hai Duong Province / Haiphong / Phu Binh District, Thai Nguyen province, |  | 1 | C-012 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Hoa Binh / Phu Tho province, the town of Phong Chau / Vinh Thinh commune, Hoa Binh district |  | 1 | C-012 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Hoang Then commune, Phong Tho district,  / Lai Chau Province / Nam Mu stream in Na Tam commune, Tam Duo |  | 1 | C-012 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Hoang Then commune, Phong Tho district, Lai Chau province |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Hoanh Bo districts (Quang Ninh province) |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | HQB: Binh Chanh, Ho Chi Minh City |  | 1 | C-025 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Ia Kha Township, Ia Grai District, Gia Lai Province |  | 1 | C-025 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Khanh Binh Tay village (Tran Van Thoi district |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Khanh Hoa Province / Ninh Thuan Province / Ninh Thuan province |  | 1 | C-012 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Kien Giang provinces (Mekong Delta) |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Kon Tum / Ngoc Tu Commune, Dak To District, Kon Tu |  | 1 | C-012 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Kong Chro village, Kong Chro, Gia Lai province |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Kỳ Anh (Thị xã) |  | 1 | B-012 | 행정구역_GADM_매칭 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Ky Anh districts (Ha Tinh province) |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Lai Chau (Nam-Ho Dien Bien district) |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Lam Dong Province (central Vietnam) |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Lao Cai (Sa Pa district) |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Lao Cai province); Bac Quang (Ha Giang province); Tan Dong (Yen Bai Province) |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Loc Bao Commune, Bao Lam District, Lam Dong Province |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Ma river, Bat Xat District, Lao Cai Province |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Mekong Delta province of Sóc Trang |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Meo Vac District, Ha Giang Province |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Meo Vac District, Ha Giang Province / Ngoc Hoi, Chiem Hoa dristrict, Tuyen Qua / Song Mien River in Thuan Hoa commune, Vi |  | 1 | C-012 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Minh Tien village (Vi Xuyen district |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Moc Hoa districts (Long An province) |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Mong Cai Township district (Quang Ninh province) |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Muong Sang commune, Moc Chau district, Son La province |  | 1 | C-025 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | MXP Boiler: Tan Thanh District, Ba Ria – Vung Tau Province |  | 1 | C-025 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Nam Can Stream, at Nam Can and Ta Ca com / Nam Non River, Luong Minh and Xa Luong c |  | 1 | C-012 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Nam Can Stream, at Nam Can and Ta Ca communes, Ky Son District, Nghe An Province |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Nam Mu stream in Na Tam commune, Tam Duong district, Lai Chau province |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Nam Non River, Luong Minh and Xa Luong communes, Tuong Duong district, Nghe An province |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Nam Tang Hydropower ,Tram Tau district |  | 1 | C-025 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Nam Xay Noi stream, Nam Xay and Nam Xe communes, Van Ban district, Lao Cai province |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | near Chieng Muon and Chieng San communes, Muong La district, Son La province |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Nghe An (Hon Ngu beach |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Nghia Lo districts (Yen Bai province) |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Ngoc Hoi, Chiem Hoa dristrict, Tuyen Quang |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Ngoc Tu Commune, Dak To District, Kon Tum Province |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Ngoi Dien River, Van Ban district, Lao Cai province |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Ngoi Dum Stream, Lao Cai province; and ,Sa Par commune, Trung Chai commune, Sa Pa district |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Ngoi Hut Stream, Tu Le Commune, Van Chan District, Nam Co Commune, Mu Chang Chai district, Yen Bai P |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Nhon Hoi Economic Zone, Quy Nhon city, Binh Dinh province |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Nhon Trach district, Dong Nai province, Vietnam |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Ninh Thuan province, Vietnam |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Northern district of Hanoi (near the Noi Bai Airport) |  | 1 | C-025 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Northern Ha Giang Province, Quang Binh District |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Pa Ve Su Commune, Muong Te district, Lai Chau province |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Phin Ho commune, Sin Ho district, Huoi Luong commune, PHong Tho district, Lai Chau province |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Phong Dien district (Thua Thien - Hue province) |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Phu Loc district (Thua Thien Hue) provinces |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Phu My district, Binh Dinh province |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Phu Ninh districts (Quang Nam) |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Phu Tho province, the town of Phong Chau, Phu Ninh district |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Phu Yen, Hoa Hoi commune |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Phuoc Dinh Commune, Thuan Nam District of the south-central coastal province of Ninh Thuan |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Phuoc Son District, Quang Nam Province, Socialist republic of Vietnam Dam Site |  | 1 | C-025 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Phuoc Son, Quang Nam Province |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | PLB: Thanh Liem, Ha Nam Province |  | 1 | C-025 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Power house 4a |  | 1 | C-025 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Power house Ngoi Xan 1, Phin Ngan commune, Bat Xat district/ Lao Cai province/ Viet Nam |  | 1 | C-025 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Quand Ngai (Ly Son District) |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Quang Binh (Bo Trach |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Quang Binh (Minh Hoa |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Quang Binh district + Son (Ha Nam Ninh province) |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Quang Nam (Duy Xuyen |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Quang Nam province, Thanh My township, Nam Giang district |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Quang Nam, Que Luu commune, Hiep Duc district |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Quang Ngai city; Binh Duong province; Nghe An province |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Quang Trach (Ba Don) |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Quang Tri province, Huong Hoa town |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Que Son commune, Que Phong district, Nghe An province |  | 1 | C-025 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Rach Gia Township district (Kien Giang province) |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Sin Ho district (Lai Chau province) |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Son Ha district (Quang Ngai province) |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Son La (Muong La) |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Song Ma districts (Son La province) |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Song Mien River in Thuan Hoa commune, Vi Xuyen district, Ha Giang province |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Sop Cop district, Son La province, Northern Vietnam |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Sun spa resort, Quang Binh |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Ta Long commune, Dakrong district, Quang Tri province |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Ta Mo village (Bac Me district |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Tan Thanh district,  Ba Ria-Vung Tau province |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Tay Ninh / Tay Ninh Province |  | 1 | C-012 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Thai Nguyen et Tuyen Quang provinces |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Thanh Hai commune, Thanh Phu district of Ben Tre Province |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Thanh Hoa Province, Quan Hoa district |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Thanh Hoa Province, Quan Hoa district / Thanh Hoa provi / Thanh Hóa Province |  | 1 | C-012 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | the Tan Lap, near Tan Long Commune, Huong Hoa district, Quang Tri province |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Thien Nam 1: Binh Lu commune, Tam Duong district, Lai Chau province |  | 1 | C-025 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Thu Duc district (Ho Chi Minh City province) |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Thuan Chau commune , Son La province |  | 1 | C-025 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Thuan Thanh district, Bac Ninh province, 40km east of Hanoi |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Tra Ling (Thai Binh province) |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Tra Vinh Province, Duyen Hai town |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Tran Van Thoi districts (Ca Mau province); Tien Giang |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Turbine No. 1 |  | 1 | C-025 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Tuyen Quang, Vietnam |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | U Minh Ha (Ca Mau province) |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | U Minh Thuong National Park (Kien Giang province) |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Upper plant: Nhan Co Commune, Dak’Rlap District |  | 1 | C-025 | 속성20_지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Van Phong Special Economic Zone in Khanh Hoa Province |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Viet Tien (Van Ban District |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Vinh Chau Town, Soc Trang Province, Mekong Delta Region |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Vinh Tan Commune, Tuy Phong District, Binh Thuan Province |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Vinh Thinh commune, Hoa Binh district |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Vinh Thuan district (Kien Giang province) |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Vinh Trach Dong commune, Bac Lieu town, Bac Lieu province |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Washington, D.C. |  | 1 | E-006 | city | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Xuan Tam commune, Van Yen district |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Yen Bai (V?n Tr?n |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Yen Chau district (Son La province) |  | 1 | B-012 | 발생지역_원문 | 지명 여러 개나 설명 문장 |
| 서술·목록형 | Yen Phong commune, Bac Me district, Ha Giang province |  | 1 | D-025 | 위치 | 지명 여러 개나 설명 문장 |

## 3. 방글라데시 — 구 64 (현지명 = geoBoundaries, 한글명 = 한국어 위키백과)
원천: https://ko.wikipedia.org/w/index.php?title=%EB%B0%A9%EA%B8%80%EB%9D%BC%EB%8D%B0%EC%8B%9C%EC%9D%98%20%EA%B5%AC&oldid=39642062 · BGD-ADM2-16705992(Creative Commons Attribution 3.0 Intergovernmental Organisations (CC BY 3.0 IGO)). 주방글라데시 대사관 글(https://overseas.mofa.go.kr/bd-ko/brd/m_2162/view.do?seq=1263477)이 직접 표기한 이름: 다카·마이멘싱·바리살·실렛·치타공·쿨나.

| 주 | 현지명 | 한글명 | 검수 | 다른 표기 키 |
|---|---|---|---|---|
| Khulna | Bagerhat | 바게르하트 | 검수 대기 |  |
| Chittagong | Bandarban | 반다르반 | 검수 대기 |  |
| Barisal | Barguna | 바르구나 | 검수 대기 |  |
| Barisal | Barisal | 바리살 | 확인(주 이름과 같음) | barishal |
| Barisal | Bhola | 볼라 | 검수 대기 |  |
| Rajshahi | Bogra | 보그라 | 검수 대기 | bogura |
| Chittagong | Brahamanbaria | 브라만바리아 | 검수 대기 | brahmanbaria |
| Chittagong | Chandpur | 찬드푸르 | 검수 대기 |  |
| Chittagong | Chittagong | 치타공 | 확인(주 이름과 같음) | chattogram |
| Khulna | Chuadanga | 추아당가 | 검수 대기 |  |
| Chittagong | Comilla | 코밀라 | 검수 대기 | cumilla |
| Chittagong | Cox's Bazar | 콕스바자르 | 검수 대기 |  |
| Dhaka | Dhaka | 다카 | 확인(주 이름과 같음) |  |
| Rangpur | Dinajpur | 디나지푸르 | 검수 대기 |  |
| Dhaka | Faridpur | 파리드푸르 | 검수 대기 |  |
| Chittagong | Feni | 페니 | 검수 대기 |  |
| Rangpur | Gaibandha | 가이반다 | 검수 대기 |  |
| Dhaka | Gazipur | 가지푸르 | 검수 대기 |  |
| Dhaka | Gopalganj | 고팔간지 | 검수 대기 |  |
| Sylhet | Habiganj | 하비간지 | 검수 대기 |  |
| Mymensingh | Jamalpur | 자말푸르 | 검수 대기 |  |
| Khulna | Jessore | 조쇼르 | 검수 대기 | jashore |
| Barisal | Jhalokati | 잘로카티 | 검수 대기 | jhalokathi |
| Khulna | Jhenaidah | 제나이다 | 검수 대기 |  |
| Rajshahi | Joypurhat | 조이푸르하트 | 검수 대기 |  |
| Chittagong | Khagrachhari | 카그라차리 | 검수 대기 |  |
| Khulna | Khulna | 쿨나 | 확인(주 이름과 같음) |  |
| Dhaka | Kishoreganj | 키쇼레간지 | 검수 대기 |  |
| Rangpur | Kurigram | 쿠리그람 | 검수 대기 |  |
| Khulna | Kushtia | 쿠슈티아 | 검수 대기 |  |
| Chittagong | Lakshmipur | 락슈미푸르 | 검수 대기 |  |
| Rangpur | Lalmonirhat | 랄모니르하트 | 검수 대기 |  |
| Dhaka | Madaripur | 마다리푸르 | 검수 대기 |  |
| Khulna | Magura | 마구라 | 검수 대기 |  |
| Dhaka | Manikganj | 마니크간지 | 검수 대기 |  |
| Sylhet | Maulvibazar | 모울비바자르 | 검수 대기 | moulvibazar |
| Khulna | Meherpur | 메헤르푸르 | 검수 대기 |  |
| Dhaka | Munshiganj | 문시간지 | 검수 대기 |  |
| Mymensingh | Mymensingh | 마이멘싱 | 확인(주 이름과 같음) |  |
| Rajshahi | Naogaon | 나오가온 | 검수 대기 |  |
| Khulna | Narail | 나라일 | 검수 대기 |  |
| Dhaka | Narayanganj | 나라양간지 | 검수 대기 |  |
| Dhaka | Narsingdi | 나르싱디 | 검수 대기 |  |
| Rajshahi | Natore | 나토르 | 검수 대기 |  |
| Rajshahi | Nawabganj | 차파이나와브간지 | 검수 대기 | chapainawabganj |
| Mymensingh | Netrakona | 네트로코나 | 검수 대기 | netrokona |
| Rangpur | Nilphamari | 닐파마리 | 검수 대기 |  |
| Chittagong | Noakhali | 노아칼리 | 검수 대기 |  |
| Rajshahi | Pabna | 파브나 | 검수 대기 |  |
| Rangpur | Panchagarh | 판차가르 | 검수 대기 |  |
| Barisal | Patuakhali | 파투아칼리 | 검수 대기 |  |
| Barisal | Pirojpur | 피로지푸르 | 검수 대기 |  |
| Dhaka | Rajbari | 라지바리 | 검수 대기 |  |
| Rajshahi | Rajshahi | 라지샤히 | 확인(주 이름과 같음) |  |
| Chittagong | Rangamati | 랑가마티 | 검수 대기 |  |
| Rangpur | Rangpur | 랑푸르 | 확인(주 이름과 같음) |  |
| Khulna | Satkhira | 사트키라 | 검수 대기 |  |
| Dhaka | Shariatpur | 샤리아트푸르 | 검수 대기 |  |
| Mymensingh | Sherpur | 셰르푸르 | 검수 대기 |  |
| Rajshahi | Sirajganj | 시라지간지 | 검수 대기 |  |
| Sylhet | Sunamganj | 수남간지 | 검수 대기 |  |
| Sylhet | Sylhet | 실렛 | 확인(주 이름과 같음) |  |
| Dhaka | Tangail | 탕가일 | 검수 대기 |  |
| Rangpur | Thakurgaon | 타쿠르가온 | 검수 대기 |  |
