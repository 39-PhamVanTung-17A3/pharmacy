---
name: pharmacy-fe-crud-standard
description: Tao hoac cap nhat module CRUD Angular (standalone + ng-zorro) theo chuan du an. Chuan hoa model BaseResponse/PageResponse, service map API data, list page co search + pagination, popup create/update co validation va notification.
---

# Quy Tac Tao Module CRUD (Pharmacy-FE)

Muc tieu: scaffold nhanh, it token, dong bo code giua cac page.

## 1. Cau truc file bat buoc

- Model dung chung dat trong `src/app/models`
- Moi feature dat trong `src/app/pages/<feature>`
- Popup dat trong `src/app/pages/<feature>/popup-<feature>`
- Service dat cung folder page: `src/app/pages/<feature>/<feature>.service.ts`

## 2. Chuan model API

Bat buoc tai `src/app/models`:
- `base-response.model.ts`
- `page-response.model.ts`
- `<feature>.model.ts`

Quy tac:
- API list: `BaseResponse<PageResponse<ApiItem>>`
- API detail/create/update: `BaseResponse<ApiItem>`
- Khong de interface API response nam trong component
- Item UI (`<Feature>`) va item API (`<Feature>ApiResponse`) tach rieng

## 3. Chuan service

- Dung `inject(HttpClient)` + `firstValueFrom(...)`
- Co `private unwrapData<T>(response: BaseResponse<T>): T`
- Neu `response.code === 0` thi throw `Error(response.message || 'Yeu cau that bai')`
- `findAll(page, size, keyword?)`:
  - set `HttpParams` gom `page`, `size`
  - chi gui `keyword` khi `keyword?.trim()` co gia tri
  - map `data.items` tu API model sang UI model
- CRUD method:
  - `create(...)`
  - `update(id, ...)`
  - `delete(id)`

## 4. Chuan list component

- Dung standalone component + `inject(...)`
- State toi thieu:
  - `pageIndex = 1`
  - `pageSize` (const, thong nhat voi BE)
  - `totalItems`
  - loading theo action (`deletingId`, ...)
- Filter form:
  - Reactive form (`fb.nonNullable.group`)
  - `valueChanges.pipe(debounceTime(300), distinctUntilChanged())`
  - doi keyword thi reset ve trang 1 roi load lai
- Xu ly loi:
  - notification error cho user
  - `console.error(...)` de debug

## 5. Chuan popup create/update

- Input:
  - `open`
  - `editing<Feature>` (null => create mode)
- Output:
  - `closePopup`
  - `<feature>Saved`
- Form:
  - Reactive form + `Validators.required`, `Validators.maxLength(...)`
  - `form.invalid` => `markAllAsTouched()`
- Save flow:
  - trim input truoc khi goi service
  - mode update goi `update`, mode create goi `create`
  - success: emit event, show success notification, reset form, dong popup
  - finally: tat trang thai submit/loading

## 6. Chuan template/UI

- Header co breadcrumb + nut them moi
- Table dung `nz-table`, tat pagination built-in (`[nzShowPagination]="false"`)
- Pagination dung shared component `app-pagging`
- Delete dung `nz-popconfirm`
- Disable action trong luc dang delete/update

## 7. Chuan import model

- Component import type UI tu service hoac model (uu tien model neu da tach)
- Service co the `export type { <Feature> } from '../../models/<feature>.model'` de giu backward compatibility
- Khong duplicate interface giong nhau o nhieu noi

## 8. Quy tac tieng Viet va encoding

- Toan bo text UI (label, button, notification, popconfirm, placeholder, breadcrumb) phai dung tieng Viet co dau dung chinh ta
- Khong viet text khong dau, tru ten bien/ham/file/path trong code
- File `.ts`, `.html`, `.scss`, `.md` phai luu UTF-8 (khong BOM) de tranh loi font/ky tu
- Khong ghi file code bang cach co the them BOM (vi du `Set-Content -Encoding UTF8` tren Windows PowerShell 5.1)
- Neu dung PowerShell de ghi file, uu tien `[System.IO.File]::WriteAllText(path, content, (New-Object System.Text.UTF8Encoding($false)))`
- Sau khi script ghi file, neu co nghi ngo encoding thi kiem tra byte dau file; khong duoc la `EF BB BF`
- Khi copy text tu nguon ngoai, phai kiem tra lai ky tu tieng Viet truoc khi commit

## 9. Checklist truoc khi ket thuc

- [ ] Da tao model trong `src/app/models` (base/page/feature)
- [ ] Service dung `BaseResponse<PageResponse<...>>` cho list
- [ ] Co `unwrapData` va xu ly `code === 0`
- [ ] Component list co search debounce + pagination
- [ ] Popup co validation + submit guard
- [ ] Co notification success/error cho action chinh
- [ ] Text UI tieng Viet co dau, khong loi encode
- [ ] Type-check pass (`npx tsc -p tsconfig.app.json --noEmit`)

## 10. Prompt mau de tiet kiem token

### 10.1 Tao module moi
"Tao module `<feature>` cho pharmacy-FE theo SKILL.md: model trong `src/app/models`, service CRUD theo BaseResponse/PageResponse, list page co search debounce + pagination, popup create/update co validator va notification."

### 10.2 Refactor module cu ve chuan chung
"Refactor module `<feature>` theo SKILL.md cua FE: tach model API/UI ra file `models`, chuan hoa service unwrapData, list dung app-pagging, popup dung reactive form + validation."

### 10.3 Dong bo contract voi BE
"Cap nhat `<feature>.service.ts` de map dung contract BE `BaseResponse<PageResponse<?>>` cho list va `BaseResponse<?>` cho CRUD, giu nguyen behavior UI hien tai."
