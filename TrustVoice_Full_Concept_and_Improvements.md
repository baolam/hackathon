# TrustVoice — Hồ sơ ý tưởng đầy đủ & các cải tiến cho Tide UNLOCKED Challenge 2

> **Phiên bản:** Concept v2.1 — 22/10/2026  
> **Giai đoạn:** Chốt ý tưởng, phạm vi sản phẩm và cam kết niềm tin — **chưa phải tài liệu kiến trúc hay code**.  
> **Nguồn đầu vào:** Bản gốc `Idea for challenge 2.md` do nhóm cung cấp; các vòng nhận xét và điều chỉnh đã thảo luận; rubric chính thức Challenge 2; tài liệu công khai của Tide.  
> **Tài liệu đi kèm:** `TrustVoice_Project_Overview_for_Development.md` (bản handoff để bắt đầu thiết kế/coding); `TrustVoice_README_Overview_300words.md` (bản tóm tắt dự thi).

---

## 0. Quy ước và quyết định tổng quan

- **[GỐC]**: có trong kế hoạch TrustVoice ban đầu.
- **[CẢI TIẾN]**: thay đổi được đề xuất sau khi đánh giá theo Challenge 2.
- **[QUYẾT ĐỊNH MVP ĐỀ XUẤT]**: mặc định áp dụng khi triển khai thử nếu nhóm không quyết định khác.
- **[CHƯA XÁC MINH]**: yêu cầu cần kiểm tra với khả năng TideCloak hoặc với tình huống sử dụng; không được quảng bá như tính năng đã hoạt động.

**Kết luận chiến lược:** Giữ tên **TrustVoice**, nhưng không giới thiệu nó đơn thuần là một website tố giác ẩn danh. Định vị thành một **quy trình đánh giá vụ việc độc lập, bảo vệ chứng cứ và danh tính, trong đó không một quản trị viên hoặc tổ chức đơn lẻ nào có thẩm quyền vượt qua các quy tắc quan trọng**.

**Định vị tiếng Anh:** *TrustVoice — Independent Oversight Without Unilateral Control.*

**Điểm khác biệt được lựa chọn:** *Conflict-Safe Independent Escalation*: một vụ việc có xung đột lợi ích có thể được chuyển tới bên đánh giá độc lập đủ điều kiện theo quy tắc thiết lập trước, mà không trao quyền kiểm soát đơn phương đối với tài liệu và kết luận cho người bị tố cáo hoặc admin ứng dụng.

**One-sentence pitch:**

> TrustVoice enables people to report misconduct and engage independent reviewers without giving any single organisation unilateral power to expose protected identities, access sensitive evidence, or finalise case decisions contrary to governed rules.

**Nguyên tắc trung tâm:** *The organisation being investigated should not be the sole authority controlling the investigation.*

---

## 1. Bối cảnh Challenge 2 — điều gì mới là quan trọng?

Trang chính thức yêu cầu một **working prototype nhỏ tích hợp TideCloak** chứng minh **một khả năng thực tế** được mở ra khi loại bỏ **trust bottleneck**. Không một admin, tổ chức, máy chủ hay AI đơn lẻ nào được tự ý vượt qua các quy tắc bảo vệ dữ liệu và quyết định. Trọng tâm là **Emergent Authority**: một thao tác nhạy cảm chỉ được cho phép khi danh tính, chính sách và sự phê duyệt hợp lệ đồng thời thỏa mãn, không phải dựa trên một chủ thể giữ toàn bộ quyền lực.

### 1.1. Rubric chính thức do nhóm cung cấp

| Tiêu chí | Trọng số | Điều TrustVoice phải thể hiện |
|---|---:|---|
| Vision & Originality | 25% | Một mô hình điều tra xuyên ranh giới tổ chức đáng tin cậy hơn, không chỉ thêm mã hóa cho hệ thống tố giác |
| Trust Constraint Insight | 20% | Nêu chính xác ai đang được yêu cầu tin ai, quyền lực nào đang tập trung và vì sao điều đó cản trở người dùng |
| Value & Impact | 20% | Ích lợi cụ thể đối với người tố giác, tổ chức, người đánh giá độc lập và người bị tố cáo |
| Why TideCloak Matters | 20% | Thao tác bảo mật quan trọng phụ thuộc vào thẩm quyền mật mã, chứ không chỉ tin backend sẽ tuân thủ |
| Prototype & Storytelling | 15% | Một câu chuyện có nhân vật, xung đột, hành động trái phép thất bại và hành động hợp lệ thành công |

**Lưu ý:** Nếu cùng một mức bảo đảm có thể có được chỉ với đăng nhập, vai trò và `if` trong backend do admin kiểm soát, giá trị TideCloak trong bài nộp chưa rõ.

### 1.2. Đánh giá sơ bộ bản ý tưởng gốc, không phải điểm giám khảo

| Tiêu chí | Đánh giá trên trọng số | Vì sao? |
|---|---:|---|
| Vision & Originality | 17/25 | Bốn cơ chế hay nhưng chưa thống nhất thành một đổi mới rõ ràng |
| Trust Constraint Insight | 16/20 | Nhìn ra bao che và thiếu niềm tin; chưa mô tả chính xác quyền lực của từng bên |
| Value & Impact | 15/20 | Tác động xã hội có ý nghĩa nhưng phạm vi khách hàng và kết quả còn rộng |
| Why TideCloak Matters | 11/20 | Chưa phân biệt đầy đủ với mã hóa + RBAC + workflow phê duyệt thông thường |
| Prototype & Storytelling | Chưa chấm/15 | Chưa có demo hoạt động để đánh giá |
| **Tổng phần có thể nhận xét** | **59/85** | **69,4% của 85 điểm đã đánh giá**; không phải tổng điểm cuộc thi |

**Mục tiêu thiết kế tham khảo:** 22/25 + 18/20 + 18/20 + 18/20 + 12/15 = **88/100**, không phải kết quả được bảo đảm.

### 1.3. Giới hạn nộp bài cần nhớ

Trang chính thức yêu cầu repository GitHub công khai có prototype tích hợp TideCloak, README project overview **không quá 300 từ** và video demo **2 phút**, `.mp4` dưới **100 MB**. Dùng dữ liệu **synthetic/mock** được khuyến khích. Trang hiển thị mốc hạn nộp **18:00 ngày 22/10/2026 giờ Việt Nam**, đồng thời có nhãn “Submissions have closed”; cần xác nhận trực tiếp trạng thái nhận bài nếu có khác biệt.

---

## 2. Kế hoạch gốc đã đề xuất điều gì?

### 2.1. Vision [GỐC]

TrustVoice là nền tảng khiếu nại/tố giác kết hợp **không gian làm việc số an toàn** để vụ việc có thể được ủy quyền cho bên ngoài như luật sư, kiểm toán viên hoặc cơ quan hòa giải. Mục tiêu: bảo vệ danh tính, tăng niềm tin và minh bạch quá trình giải quyết.

### 2.2. Trust constraints [GỐC]

1. **Privacy & Authority:** người tố giác lo bị lộ danh tính cho người bị tố cáo.
2. **Cover-up:** người có quyền lực có thể ém hoặc bác bỏ đơn.
3. **Lack of Objectivity:** bộ phận xử lý nội bộ có thể thiếu độc lập; chia sẻ hồ sơ cho người ngoài lại tạo nguy cơ mất bí mật.

### 2.3. Bốn tính năng [GỐC] và nguồn cảm hứng mà nhóm nêu

- **Identity Shield** — lấy cảm hứng từ Care Passport/Rental Application Passport: người cung cấp thông tin kiểm soát mức tiết lộ danh tính.
- **Delegated Resolution Space** — lấy cảm hứng từ Matter Room/Research Consent Vault: tạo phòng làm việc theo vụ việc, cấp quyền từng hồ sơ cho bên thứ ba.
- **Anti-Cover-up Protocol** — lấy cảm hứng từ Dual-Control Expense Desk/Community Ballot: đóng/bác bỏ hồ sơ cần phê duyệt chéo.
- **Blind Review Process** — lấy cảm hứng từ Blind Portfolio Review: ban đầu che thông tin định danh, sau đó tiết lộ theo giai đoạn cần thiết.

### 2.4. Những khẳng định cần sửa [CẢI TIẾN]

| Lời hứa ban đầu | Phiên bản trung thực hơn |
|---|---|
| “Khách quan tuyệt đối” | Giảm quyền thao túng và xung đột lợi ích; không bảo đảm người đánh giá không thiên lệch |
| “Ẩn danh hoàn toàn” | Phân biệt ẩn danh thật sự với danh tính được giữ kín; bảo vệ metadata cần xử lý riêng |
| “Admin không thể xóa sự việc” | Không thể *đơn phương thực hiện những thao tác được ràng buộc*; xóa DB/từ chối dịch vụ là rủi ro khác |
| “Ranh giới dữ liệu tuyệt đối” | Hạn chế truy cập bằng ràng buộc mật mã trong mô hình đe dọa xác định |
| “Bên thứ ba không thể làm lộ thông tin” | Bên thứ ba chỉ được cấp phần phù hợp; người đã đọc hợp lệ vẫn có thể làm lộ thông tin |

---

## 3. Vấn đề được chốt: một nghịch lý niềm tin nhiều bên

### 3.1. Tình huống sử dụng chính [QUYẾT ĐỊNH MVP ĐỀ XUẤT]

Một nhân viên phát hiện quản lý cấp cao sửa số liệu báo cáo tài chính. Người đó có tài liệu nhưng không muốn gửi tới hệ thống do chính bộ phận quản lý đó vận hành. Họ muốn người đánh giá độc lập thẩm tra, còn công ty không muốn tùy tiện chia sẻ toàn bộ dữ liệu mật ra bên ngoài.

Các bên đều có lợi ích hợp lý nhưng xung đột:

- **Nhân viên:** cần chứng minh sai phạm, sợ bị nhận diện và trả đũa.
- **Tổ chức:** muốn điều tra và bảo vệ dữ liệu nội bộ, nhưng không thể đòi hỏi người tố giác tin một admin có xung đột lợi ích.
- **Điều tra viên độc lập:** cần dữ liệu đủ để đánh giá, nhưng không nên được toàn quyền truy cập hệ thống.
- **Người bị tố cáo:** có quyền riêng tư, được trình bày phản hồi, không bị coi là có lỗi chỉ vì có đơn tố giác.

### 3.2. Trust bottleneck thực sự

**Không chỉ là “dữ liệu chưa mã hóa”, mà là quyền lực được tập trung ở một đầu mối.** Trong nhiều hệ thống thông thường, backend hoặc admin có thể thay đổi quyền, mở hồ sơ hoặc ghi lại trạng thái cuối cùng nếu họ kiểm soát cả khóa, logic và database.

**Câu hỏi phải trả lời trong demo:** Nếu quản trị viên của ứng dụng cũng có liên quan tới vụ việc, họ có thể đơn phương xem chứng cứ bảo vệ, tiết lộ danh tính hoặc tuyên bố kết thúc vụ việc hay không?

### 3.3. Giải pháp khái niệm

TrustVoice tách **quyền nộp thông tin**, **quyền xem chứng cứ**, **quyền ủy quyền người đánh giá** và **quyền ghi nhận kết cục**. Những quyền nhạy cảm phải được ràng buộc bởi danh tính/chính sách/phê duyệt thay vì một nút bấm của admin.

**Đổi mới:** *Conflict-Safe Independent Escalation* — đưa vụ việc có xung đột lợi ích vào tuyến đánh giá độc lập theo quy tắc đã thiết lập trước, không cho bên bị tố cáo đơn phương quyết định ai có quyền xem hoặc kết thúc quy trình.

---

## 4. Định vị mới và sự khác biệt

**Không nên quảng bá:** “another anonymous whistleblowing website”, “secure complaint manager”, “censorship-proof investigation system”.

**Nên quảng bá:** *A conflict-safe, independently governed case-review workflow* — phối hợp đánh giá chứng cứ giữa các bên không hoàn toàn tin nhau mà không giao quyền thẩm quyền nhạy cảm cho một chủ thể duy nhất.

Các nền tảng như **SecureDrop** đã giải quyết nghiêm túc việc nhận chứng cứ từ nguồn ẩn danh; **GlobaLeaks** phục vụ các quy trình tố giác. TrustVoice không nên nhận công về việc “phát minh tố giác ẩn danh”. Điểm mới của concept là **quy trình ủy quyền/đánh giá độc lập khi bên tiếp nhận có xung đột lợi ích**, sử dụng ràng buộc thẩm quyền mật mã.

Không khẳng định đây là tính năng độc nhất trên thị trường nếu chưa nghiên cứu cạnh tranh toàn diện.

---

## 5. Ba trụ cột sản phẩm được giữ lại

### 5.1. Protected Disclosure — nộp chứng cứ được bảo vệ

- Người dùng tạo vụ việc, mô tả sự kiện và gửi chứng cứ bằng dữ liệu mô phỏng ở MVP.
- Danh tính (nếu được cung cấp) phải được xem như lớp thông tin riêng với nội dung tố giác và tệp chứng cứ.
- Người dùng nhận **mã vụ việc/receipt** để theo dõi.
- Tổ chức không được mặc nhiên xem danh tính người báo cáo.
- Người báo cáo được thông báo rõ giới hạn bảo vệ, kể cả metadata và rủi ro từ file gốc.

**Hai chế độ cần tách rõ:**

| Chế độ | Ý nghĩa | Quyết định MVP |
|---|---|---|
| Anonymous | Không thu thập danh tính thật; không có gì để “mở khóa danh tính” về sau | Tính năng tương lai hoặc luồng riêng; **không** tuyên bố có nếu chưa xây |
| Confidential / Pseudonymous | Có thể nắm danh tính được bảo vệ; chỉ tiết lộ theo điều kiện phù hợp; giao diện có thể dùng bí danh | **Chọn làm MVP** để demo consent/restricted identity disclosure nhất quán |

**[CHƯA XÁC MINH]** Các tình huống bắt buộc cung cấp danh tính thật, ngoại lệ theo luật và xử lý người dùng không đăng nhập cần chính sách bổ sung ngoài MVP.

### 5.2. Independent Escalation — tuyến đánh giá độc lập

Đây là **core innovation** của TrustVoice.

- Mỗi vụ việc có một **Case Room** với ranh giới dữ liệu riêng.
- Khi có xung đột lợi ích, người tố giác được **yêu cầu** chuyển hồ sơ tới một bên đánh giá độc lập.
- Người đánh giá phải thuộc một **danh sách đủ điều kiện được xác lập trước** hoặc đi qua một quy trình xác minh độc lập; người tố giác không được đưa bất kỳ tài khoản ngoài nào vào để đọc dữ liệu doanh nghiệp.
- Bên bị tố cáo không được có quyền phủ quyết đơn phương việc xem xét yêu cầu chuyển cấp.
- Reviewer chỉ được truy cập **phần chứng cứ đúng vụ việc và mức độ cần thiết**.
- Người tố giác theo dõi việc yêu cầu chuyển cấp được nhận, xử lý và phản hồi như thế nào.

**Câu hỏi khó cần chốt:** Ai được công nhận là người đánh giá độc lập? Đề xuất MVP: danh sách reviewer được thiết lập trước bởi một cơ chế quản trị có thành phần giám sát ngoài chuỗi quản lý bị tố cáo; chính sách chọn reviewer cố định cho demo. Điều này không tự chứng minh reviewer khách quan.

### 5.3. Governed Resolution — quyết định có ràng buộc thẩm quyền

- Không một admin/nội bộ đơn lẻ nào được tự ghi nhận **kết thúc chính thức theo quy trình bảo vệ** nếu chính sách yêu cầu nhiều bên.
- Phân biệt **đánh giá của một bên**, **đồng thuận kết luận**, **đang bất đồng** và **chuyển cấp**.
- Nếu hai bên không đồng ý, hệ thống phải ghi nhận **Disputed/Escalated**, không tự bác đơn cũng không treo vĩnh viễn do một bên từ chối ký.
- Người bị tố cáo có cơ hội phản hồi phù hợp mà không được trao quyền sửa hoặc mở chứng cứ trái phép.

**Điểm cần đặc biệt lưu ý:** TideCloak không mặc nhiên bảo vệ trạng thái `closed` nếu nó chỉ là một field trong database. Muốn demo “admin không thể đóng hồ sơ”, hành động ghi nhận kết quả phải là **một hành động được bảo vệ thực sự**, không chỉ là kiểm tra quyền ở frontend/backend. Đây là **yêu cầu phải chứng minh ở giai đoạn thiết kế kỹ thuật**.

---

## 6. Xem lại từng tính năng bản gốc

| Tính năng gốc | Quyết định | Cải tiến | Ưu tiên |
|---|---|---|---|
| Identity Shield | **Giữ, làm rõ** | Tách anonymous và confidential; kiểm soát disclosure; bảo vệ identity/evidence theo lớp | Cao |
| Delegated Resolution Space | **Giữ làm trung tâm** | Từ “phòng chia sẻ tài liệu” thành **ủy quyền điều tra có giới hạn, chống xung đột lợi ích** | Rất cao |
| Anti-Cover-up Protocol | **Giữ, thiết kế lại** | Không dùng đồng ký để tạo deadlock; có trạng thái bất đồng và chuyển cấp; không nhầm với chống xóa DB | Rất cao |
| Blind Review Process | **Giảm phạm vi** | Progressive disclosure — chỉ ẩn những gì chưa cần; đánh giá theo giai đoạn | Trung bình/thấp |

**Không đưa AI làm trung tâm MVP.** AI tóm tắt hồ sơ hoặc nhận diện nguy cơ bias có thể gây rủi ro suy diễn, lộ dữ liệu và mở rộng demo không cần thiết.

---

## 7. Mô hình vai trò và thẩm quyền mong muốn

### 7.1. Vai trò

1. **Reporter / Whistleblower:** người gửi, cung cấp thông tin, theo dõi vụ việc, kiểm soát sự đồng ý tiết lộ danh tính bí mật.
2. **Organisation Case Handler:** tiếp nhận, giải trình, điều phối trong phạm vi quyền; **không đồng nghĩa** với người quản trị toàn hệ thống.
3. **Independent Reviewer:** người đã được xác minh/đủ điều kiện; chỉ xem dữ liệu được cấp đúng vụ việc.
4. **Governance Participants:** những bên có quyền chấp thuận thay đổi chính sách hoặc thao tác có điều kiện; không phải một “super admin” mới.
5. **Application Administrator:** vận hành ứng dụng; không mặc nhiên có thẩm quyền mật mã đọc dữ liệu nhạy cảm.
6. **Accused / Respondent:** người được nêu trong vụ việc, có quyền phản hồi theo thủ tục phù hợp, không tự kiểm soát quyết định xử lý.

### 7.2. Bảng quyền ở mức ý tưởng (không phải cấu hình SDK)

| Hành động | Được phép khi nào? | Ai không được làm một mình? |
|---|---|---|
| Submit report | Reporter gửi theo quy tắc intake | Người bị tố cáo không chặn tiếp nhận chỉ vì mình bị nêu tên |
| View ordinary case metadata | Case handler được phân công | Không mở rộng thành xem evidence/identity |
| View protected evidence | Danh tính hợp lệ + quyền theo vụ việc + policy/approval phù hợp | Admin/app server không mặc nhiên đọc |
| Reveal confidential identity | Consent minh thị của reporter và người nhận đủ thẩm quyền; trường hợp ngoại lệ pháp lý chưa trong MVP | Admin, reviewer hoặc organisation tự mở |
| Request independent escalation | Reporter hoặc bộ phận đủ quyền yêu cầu | Người bị tố cáo không phủ quyết đơn phương |
| Assign reviewer | Từ danh sách đủ điều kiện theo cơ chế giám sát trước đó | Reporter không đưa tùy tiện người ngoài; accused handler không chỉ định theo ý riêng |
| File reviewer assessment | Reviewer đã được cấp quyền | Organisation không sửa kết luận của reviewer |
| Finalize governed case outcome | Đáp ứng điều kiện hợp lệ của quy trình; ghi nhận dissent nếu có | Một admin nội bộ không tự tạo trạng thái “resolved” |
| Change sensitive access policy | Quy trình quản trị nhiều bên được bảo vệ | Một admin đơn lẻ không thay chính sách |
| Delete/recover stored data | Cần chính sách lưu giữ, sao lưu và recovery riêng | **Không được tuyên bố TideCloak tự ngăn xóa DB** |

**Nguyên tắc:** xem chứng cứ, tiết lộ danh tính, chọn người đánh giá và kết thúc vụ việc là những loại quyết định **khác nhau**, không nên gộp vào một quyền `admin`.

---

## 8. Hành trình người dùng và vòng đời vụ việc

### 8.1. Happy path — vụ việc được chuyển đánh giá độc lập

1. Reporter vào TrustVoice, xem rõ bảo đảm và giới hạn bảo mật.
2. Reporter nộp tường trình và file mock, chọn **Confidential** (MVP).
3. Hệ thống trả **case reference/receipt** để theo dõi.
4. Case handler được thông báo có hồ sơ mới, chỉ thấy dữ liệu phù hợp vai trò.
5. Reporter yêu cầu **Independent Escalation** do người bị tố cáo có quyền quản lý.
6. Hệ thống xét quy tắc chuyển cấp; reviewer đủ điều kiện được đưa vào Case Room với phạm vi dữ liệu tối thiểu.
7. Reviewer xem được chứng cứ được cấp quyền; reviewer khác và admin thử mở thì bị từ chối ở thao tác được bảo vệ.
8. Reviewer ghi nhận nhận xét; tổ chức có thể phản hồi theo quyền.
9. Vụ việc vào kết cục phù hợp: **Resolved**, **Disputed**, hoặc **Escalated**; reporter nhận cập nhật có thể hiểu được.

### 8.2. Failure path — admin có xung đột lợi ích

1. Admin thấy case tồn tại nhưng cố mở nội dung bí mật: bị từ chối tại ranh giới thẩm quyền mật mã.
2. Admin cố cấp thêm quyền giải mã cho chính mình: cần quy trình quản trị/phê duyệt hợp lệ; không thể hoàn tất đơn phương.
3. Admin cố đánh dấu “resolved”: chỉ bị chặn đáng tin cậy nếu **thao tác kết luận thực sự được bảo vệ**; nếu không triển khai được, phải giới hạn tuyên bố của demo vào “encrypted-evidence access denied”.
4. Admin có thể thử phá tính sẵn sàng bằng cách tắt dịch vụ/xóa DB; đây là **rủi ro ngoài bảo đảm của TideCloak**, không được dựng kịch bản giả rằng sẽ tự được ngăn.

### 8.3. Các trạng thái vụ việc gợi ý

`Submitted → Under Initial Review → Independent Review Requested → Independent Review Active → Assessment Filed → (Resolved | Disputed | Escalated)`

Ngoài ra có `Withdrawn` hoặc `Archived` chỉ khi chính sách rõ và không phá hủy chứng cứ đang cần xử lý; nên để ngoài MVP nếu làm tăng độ phức tạp.

### 8.4. Người dùng thấy gì?

- Reporter: form nộp, receipt, dashboard trạng thái, yêu cầu chuyển cấp, lịch sử cập nhật được phép xem, consent nếu cần.
- Case handler: danh sách case được phân công, bản tóm tắt, quyền đề nghị reviewer, phản hồi/cập nhật nghiệp vụ.
- Reviewer: Case Room được cấp quyền, danh sách evidence hợp lệ, ghi nhận assessment.
- Admin: thông tin vận hành và thử nghiệm các hành động bảo vệ, nhưng không phải một chế độ bí mật toàn quyền.

---

## 9. Vì sao TideCloak thay đổi sản phẩm?

### 9.1. Trả lời câu hỏi “Sao không chỉ dùng RBAC?”

RBAC và workflow server-side có thể tạo trải nghiệm đa vai trò; nhưng nếu cùng một backend/admin nắm khóa, quy tắc và quyền sửa database, họ có thể có khả năng vượt qua những kiểm tra đó. TrustVoice cần thể hiện một thay đổi về **người nắm thẩm quyền**, không chỉ là nhiều checkbox hơn.

Theo tài liệu TideCloak, các khái niệm liên quan gồm:

- **Emergent Authority:** hành động nhạy cảm chỉ xuất hiện khi identity, policy, approvals phù hợp; không có một chủ thể giữ toàn bộ master key.
- **Quorum-Enforced Governance/Authorization:** thay đổi đặc quyền/chính sách nhạy cảm cần phê duyệt nhiều bên trong cấu hình có áp dụng.
- **Hermetic E2EE:** hỗ trợ bảo vệ dữ liệu theo chính sách truy cập thay vì backend mặc nhiên đọc plaintext.
- **Forseti Programmable Policy:** hỗ trợ những quy tắc tùy chỉnh, nhưng **cần xác minh phiên bản SDK, luồng chính sách và tính khả thi đối với từng yêu cầu cụ thể khi triển khai**.

### 9.2. Bản đồ “điều TideCloak hỗ trợ” vs “điều TrustVoice phải tự thiết kế”

| Cam kết sản phẩm | Lớp liên quan | Lưu ý |
|---|---|---|
| Admin không mặc nhiên giải mã tài liệu | TideCloak protected crypto/data access, cấu hình chính sách đúng | Cần chứng minh bằng hành động giải mã bị từ chối, không chỉ ẩn nút |
| Một admin không tự tăng quyền giải mã | QEA/governed IAM changes | Phụ thuộc cách realm/admin quorum thực sự được cấu hình |
| Reviewer được xem đúng phần tài liệu | Ranh giới tài liệu theo vụ việc + chính sách cấp quyền | App phải định nghĩa phân đoạn dữ liệu đúng |
| Reporter giữ quyền đối với danh tính | Mô hình consent + bảo vệ lớp identity | TideCloak không tự thiết kế UX/luật consent |
| Admin không tự kết thúc vụ việc | Governed outcome workflow riêng và bằng chứng kết luận | Không có sẵn chỉ nhờ đăng nhập TideCloak |
| Duy trì hồ sơ nếu DB bị xóa | Backup, retention, independent receipts, vận hành | **Ngoài bảo đảm mặc định của TideCloak** |
| Bảo đảm reviewer độc lập | Quản trị người/đạo đức/quy trình | **Không thể suy ra từ mật mã** |
| Chống người đã xem hợp lệ chụp/copy | Pháp lý, quy trình, giám sát, giới hạn nội dung | **Không thể ngăn hoàn toàn bằng E2EE** |

**Bài kiểm tra cốt lõi:** nếu backend bị chiếm nhưng không có thẩm quyền mật mã hợp lệ, người tấn công không được giải mã được tài liệu đã bảo vệ. Đây là khác biệt cần đo và diễn giải trong video.

---

## 10. Threat model và giới hạn bảo mật

### 10.1. Kẻ tấn công/các tình huống cần xét

- **Malicious/compromised app admin:** có thể thao tác ứng dụng, muốn đọc chứng cứ hoặc sửa đặc quyền.
- **Conflicted manager:** bị tố cáo, muốn chặn xem xét hay viết kết luận có lợi.
- **Over-curious reviewer:** đã được ủy quyền một case, cố mở case khác hoặc danh tính reporter.
- **Compromised backend/storage:** nắm DB/file nhưng không nên đồng nghĩa có quyền giải mã nội dung bảo vệ.
- **Colluding governance participants:** nhiều người thông đồng có thể vượt qua ngưỡng phê duyệt nếu đủ điều kiện; không tuyên bố bất khả xâm phạm.
- **Malicious reporter:** nộp tố cáo sai, nội dung vi phạm quyền riêng tư hoặc tài liệu không có quyền sở hữu.

### 10.2. Tài sản cần bảo vệ

- Danh tính và liên lạc của reporter (nếu có).
- Nội dung tố giác, file chứng cứ, dữ liệu tổ chức.
- Quyền cấp access, sự đồng ý, danh tính reviewer.
- Tính toàn vẹn/nguồn gốc của assessment và quyết định được bảo vệ.
- Metadata và lịch sử xử lý (một số có thể nhạy cảm).

### 10.3. Không được quảng bá quá mức

- Không bảo đảm **ẩn danh mạng** hoặc loại bỏ IP/timing metadata nếu chưa có cơ chế chuyên biệt.
- File chứng cứ có thể chứa tác giả, lịch sử chỉnh sửa, vị trí hoặc dấu nhận dạng.
- Không thể bảo đảm người nhận được quyền xem hợp lệ sẽ không ghi chép, chụp lại hoặc tiết lộ.
- Không bảo đảm hồ sơ không thể bị xóa, dịch vụ không thể bị tắt hoặc tổ chức không thể gây cản trở ngoài hệ thống.
- Không bảo đảm investigator khách quan, kết luận đúng pháp luật hay tố cáo chính xác.
- Quorum giúp giảm quyền lực đơn phương, nhưng **không tự loại trừ thông đồng đủ ngưỡng**.

### 10.4. Quyền của người bị tố cáo

- Không công khai cáo buộc thành sự thật đã được xác nhận.
- Giữ kín dữ liệu không cần thiết và kiểm soát người được xem.
- Cho phép phản hồi theo quy trình khi thích hợp mà không làm lộ danh tính reporter ngoài chính sách.
- Quyết định cuối cùng là kết quả quy trình, không phải “AI phán tội” hay kết luận pháp lý tự động.

---

## 11. Chọn sản phẩm tối thiểu (MVP), không dàn trải

### 11.1. Bắt buộc để câu chuyện đúng với Challenge 2

1. Có một tình huống tố giác doanh nghiệp dùng **dữ liệu mô phỏng**.
2. Reporter nộp được hồ sơ và chứng cứ bảo vệ; nhận receipt và thấy trạng thái.
3. Có hai lớp thông tin: **evidence** và **protected reporter identity** (identity có thể chỉ mô phỏng, không bắt buộc tiết lộ trong demo).
4. Một admin/bên không đủ quyền thử xem evidence và **thất bại tại thao tác thực sự được bảo vệ**.
5. Một independent reviewer đã được phép hợp lệ **xem đúng chứng cứ được cấp**, không thấy case khác.
6. Người bị tố cáo/admin không thể tự nâng quyền giải mã bằng một thao tác ứng dụng đơn thuần.
7. Có một đường đi **governed case outcome** hoặc minh họa minh bạch rằng phần này là thiết kế chưa hoàn thiện. **Không giả lập bảo vệ bằng cách chỉ disable button.**
8. Giao diện đủ trực quan để kể câu chuyện 2 phút.

### 11.2. Nên có nếu không ảnh hưởng cốt lõi

- Timeline cho từng case (chỉ thấy sự kiện được phép).
- Receipt có thể đối chiếu tính toàn vẹn nếu có cơ chế thực sự phù hợp.
- Trạng thái `Disputed`/`Escalated` để tránh deadlock.
- Cách giải thích **“Why access denied?”** trên demo.
- Disclosure consent hiển thị rõ người nhận/phạm vi/mục đích.

### 11.3. Không thuộc MVP

- Phân tích tố cáo bằng AI hoặc tự kết luận đúng/sai.
- Ẩn danh ở mức Tor/nguồn mạng trừ khi thực sự triển khai và kiểm thử riêng.
- Tự động gửi tới công an/tòa án hay tổ chức pháp lý thật.
- Quản lý mọi lĩnh vực khiếu nại/đa quốc gia.
- Bảo đảm chống xóa/chống DoS ở mức hạ tầng.
- Hệ thống kiểm toán pháp lý đầy đủ hay cam kết tuân thủ mọi luật.

---

## 12. Storytelling và kịch bản demo 2 phút

**Tên kịch bản:** *The Compromised Admin*.

| Thời gian | Cảnh | Điều cần chứng minh |
|---|---|---|
| 0–20s | Một nhân viên gửi hồ sơ tố giác quản lý và tài liệu chứng cứ | Problem & protected submission |
| 20–45s | Đăng nhập vai admin, thử đọc chứng cứ; thao tác protected access bị từ chối | Không có unilateral decryption authority |
| 45–80s | Đề nghị chuyển đánh giá và reviewer hợp lệ được xem phần tài liệu cần thiết | Safe cross-organisational delegation |
| 80–105s | Admin cố ghi nhận vụ việc “resolved” trái quy tắc; hệ thống yêu cầu thẩm quyền hợp lệ **nếu đã triển khai được** | Governed decisions, không phải frontend-only deny |
| 105–120s | Reporter thấy trạng thái, reviewer assessment và sự kiện được ghi nhận | Human value & transparency |

**Phương án dự phòng trung thực:** Nếu chưa bảo vệ được thao tác kết thúc bằng thẩm quyền phù hợp, hãy demo mạnh **access denied / authorised evidence access** và nêu governed closure là planned extension. Không quay một màn hình chặn nút rồi nói backend không thể bị bypass.

**Thông điệp cuối:** *The admin can manage the platform—but cannot unilaterally become the authority to open protected evidence.*

---

## 13. Tiêu chí nghiệm thu sản phẩm ở mức hành vi (cho giai đoạn code sau)

Các trường hợp dưới đây là **acceptance criteria cần kiểm thử**, không khẳng định hiện đã triển khai.

| ID | Tình huống | Kỳ vọng người dùng quan sát được |
|---|---|---|
| AC-01 | Reporter nộp hồ sơ hợp lệ | Nhận case reference và xác nhận nộp |
| AC-02 | Reporter xem hồ sơ của chính mình | Chỉ thấy phần thông tin của mình theo chính sách |
| AC-03 | Admin không được cấp quyền đọc evidence | Giải mã/đọc protected evidence thất bại từ nguồn bảo vệ thực sự |
| AC-04 | Admin đổi nhãn UI hoặc request API thủ công | Không thu được plaintext trái quyền |
| AC-05 | Reviewer hợp lệ được cấp quyền cho Case A | Xem đúng tài liệu A được phê duyệt |
| AC-06 | Reviewer A cố xem Case B | Không thể giải mã/truy cập nội dung B |
| AC-07 | User cố đọc reporter identity khi chưa có consent | Bị từ chối |
| AC-08 | Reporter cho phép disclosure trong phạm vi xác định | Chỉ người nhận/điều kiện phù hợp được tiếp cận |
| AC-09 | Admin cố tự cấp quyền hoặc sửa policy nhạy cảm | Không hoàn tất nếu thiếu phê duyệt/cơ chế governance áp dụng |
| AC-10 | Một bên tự đánh dấu case resolved | Không được xem như kết luận chính thức nếu policy chưa thỏa (chỉ khi có protected workflow thật) |
| AC-11 | Bên nội bộ và reviewer bất đồng | Trạng thái thể hiện `Disputed`/`Escalated`, không tự xóa vụ việc |
| AC-12 | Sau khi access bị từ chối | Lý do hiển thị không làm lộ bí mật về case/identity |
| AC-13 | Toàn bộ nội dung demo | Không dùng tên, hồ sơ hay tài liệu nhạy cảm của người thật |

**Nhóm cần đặt điều kiện dừng:** Nếu không chứng minh được bảo đảm khác biệt so với backend thông thường, thu hẹp concept vào một thao tác được TideCloak bảo vệ có thể kiểm chứng trước khi thêm tính năng.

---

## 14. Product UX đề xuất (chưa phải UI design)

Các màn hình tối thiểu cần có về mặt trải nghiệm:

1. **Landing / Trust Explanation** — TrustVoice là gì, ai được làm gì, cái gì không được bảo đảm.
2. **New Report** — mô tả, evidence, confidential identity/alias, consent & cảnh báo metadata.
3. **Reporter Case View** — case receipt, trạng thái, yêu cầu independent escalation, timeline.
4. **Organisation Inbox** — hồ sơ có quyền được xem; yêu cầu đánh giá độc lập/ghi nhận phản hồi.
5. **Independent Reviewer Room** — chỉ danh sách case được cấp, evidence đủ quyền và assessment.
6. **Governance / Approval View** — điều kiện phê duyệt cho hành động nhạy cảm và kết quả; không phải control panel của super-admin.
7. **Adversarial Demo View** — đổi persona giữa Reporter, Compromised Admin, Reviewer để minh họa trực quan allow/deny.

Người dùng cuối cần hiểu *vì sao* một hành động được phép hoặc bị chặn, nhưng màn hình không được hiển thị metadata bí mật trong thông báo lỗi.

---

## 15. Giá trị & tác động phải đo được

**Tệp khách hàng đầu tiên:** doanh nghiệp có HR/compliance/whistleblowing channel, nơi có nguy cơ xung đột lợi ích giữa người bị tố cáo và người tiếp nhận.

**Giá trị theo nhóm:**

- Reporter: giảm phụ thuộc vào admin có xung đột lợi ích; có đường chuyển cấp và theo dõi minh bạch.
- Organisation: có bằng chứng cơ chế phân chia thẩm quyền thay vì chỉ lời hứa “chúng tôi không xem”.
- Independent reviewer: có thông tin đúng phạm vi để đánh giá mà không buộc công ty xuất toàn bộ kho dữ liệu.
- Respondent: hạn chế phát tán thông tin nhạy cảm, có quy trình ghi nhận phản hồi.

**Các chỉ số prototype (không phải chỉ số tác động xã hội đã được chứng minh):**

- 100% yêu cầu truy cập bị cấm trong bộ test demo bị từ chối ở protected operation.
- 100% yêu cầu hợp lệ trong bộ test được thực thi cho đúng case/scope.
- Không có đường user-interface hay yêu cầu backend phổ thông nào tự cấp quyền giải mã cho admin mà bỏ qua cơ chế thẩm quyền.
- Người xem demo có thể mô tả trust bottleneck và khác biệt TideCloak sau 2 phút.

---

## 16. Rủi ro về tính nguyên bản và cách trả lời phản biện

**Q: Đây chẳng phải SecureDrop cộng thêm dashboard?**  
A: Không cạnh tranh ở việc nhận tài liệu ẩn danh; trọng tâm là **đánh giá độc lập có ràng buộc thẩm quyền** sau khi nộp, khi chính tổ chức xử lý có thể bị tố cáo.

**Q: Vì sao không E2EE + RBAC + 2 approvals ở backend?**  
A: Vì một backend có toàn quyền về khóa/chính sách vẫn là điểm tập trung thẩm quyền. Claim của TrustVoice phải được chứng minh bằng thao tác mà backend/admin đơn lẻ không thể tự cho phép.

**Q: Nếu tổ chức không hợp tác thì sao?**  
A: Quy trình có đường `Disputed/Escalated` và phân công reviewer theo chính sách xác lập trước; không khẳng định hệ thống có thể cưỡng chế tổ chức ngoài đời.

**Q: Reviewer có thể làm lộ chứng cứ sau khi đọc không?**  
A: Có, đây là rủi ro phải thừa nhận; sản phẩm giới hạn người và phạm vi được xem, không bảo đảm xóa mọi rủi ro sau khi được phép.

**Q: Admin có thể xóa DB không?**  
A: Có thể ảnh hưởng availability; cần cơ chế lưu giữ/backup/audit độc lập ngoài bài toán cryptographic authorization. Không được nói TideCloak tự giải quyết.

**Q: Ai chọn reviewer?**  
A: Đề xuất danh sách đủ điều kiện/oversight thiết lập trước, không do người bị tố cáo quyết định riêng lúc phát sinh hồ sơ.

**Q: Có bảo vệ cả người bị tố cáo không?**  
A: Có: quyền riêng tư, hạn chế phổ biến cáo buộc, quyền phản hồi hợp lý và không kết luận tội tự động.

---

## 17. Quyết định cần chốt trước khi viết code

Đây là các câu hỏi mở **được đề xuất câu trả lời mặc định**, không giấu sự chưa chắc chắn.

| # | Câu hỏi | Mặc định MVP đề xuất | Trạng thái |
|---|---|---|---|
| D1 | Domain đầu tiên? | Tố giác gian lận trong doanh nghiệp | Đề xuất chốt |
| D2 | Ẩn danh hay confidential? | Confidential/pseudonymous, tách identity protected | Đề xuất chốt |
| D3 | Ai chọn independent reviewer? | Từ roster đủ điều kiện theo chính sách trước vụ việc | Cần thiết kế governance |
| D4 | Người bị tố cáo có thể veto escalation? | Không veto đơn phương | Đề xuất chốt |
| D5 | Quy tắc disclosure identity? | Reporter consent minh thị + người nhận có quyền; ngoại lệ pháp lý ngoài MVP | Đề xuất chốt |
| D6 | Bên nào đóng case? | Kết cục chính thức theo quy tắc đa bên, có Disputed/Escalated | Cần chứng minh protected workflow |
| D7 | Làm gì khi không triển khai được governed closure? | Thu hẹp demo vào protected evidence & delegation, tuyên bố closure là kế hoạch | Fallback bắt buộc |
| D8 | Dùng dữ liệu thật? | Không. Chỉ synthetic | Chốt |
| D9 | AI phân tích tài liệu? | Không trong MVP | Chốt |
| D10 | Tiêu chí thành công demo? | Protected denial + authorised reviewer access + câu chuyện rõ | Chốt |

### Ba quyết định chiến lược quan trọng nhất

1. **Ai có quyền chỉ định/kiểm tra tính độc lập của reviewer?**
2. **Quyền tối thiểu mà reporter luôn giữ là gì — đặc biệt consent với identity?**
3. **Nếu tổ chức từ chối hợp tác, quy trình kết luận/chuyển cấp không bị deadlock như thế nào?**

Nhóm cần quyết định rõ trong chính sách sản phẩm trước khi thiết kế code, thay vì để người triển khai tự suy diễn.

---

## 18. Định nghĩa thành công và bước tiếp theo

### Thành công về mặt ý tưởng

Một người ngoài nhóm nghe câu pitch có thể trả lời ba câu hỏi:

- **Vì sao sản phẩm cần thiết?** Vì người tố giác không thể tin hoàn toàn bên đang bị tố cáo.
- **Điều gì mới khả thi?** Chia sẻ chứng cứ có giới hạn để đánh giá độc lập mà không trao quyền toàn diện cho admin/tổ chức.
- **Tại sao TideCloak cần thiết?** Vì thẩm quyền cho phép thao tác bảo vệ không nằm trọn trong một backend hay một super-admin.

### Thành công về prototype sau này

Một thao tác của admin **không đủ thẩm quyền** bị từ chối ở lớp mật mã, một thao tác hợp lệ của reviewer thành công, và người xem hiểu **ranh giới bảo đảm**. Nếu làm thêm governed closure, phải có cơ chế kiểm soát thật đối với hiệu lực của kết luận.

### Thứ tự thực hiện sau khi nhóm chốt concept (không viết code trong tài liệu này)

1. Chốt reviewer governance và confidential identity/consent.
2. Chốt protected operation đầu tiên sẽ demo (evidence access).
3. Kiểm tra tài liệu/khả năng TideCloak phiên bản sử dụng.
4. Soạn threat model và permission/policy specification có thể kiểm thử.
5. Thiết kế luồng UI, case state và data boundary.
6. Triển khai một vertical slice end-to-end bằng synthetic data.
7. Quay 2-minute demo và viết README <= 300 words.

---

## 19. Tài liệu tham chiếu

- Nguồn trực tiếp của nhóm: `Idea for challenge 2.md` (bản gốc TrustVoice; chưa có bằng chứng về hệ thống đã vận hành).
- Tide UNLOCKED Challenge 2: https://tide.org/unlocked/
- TideCloak Core Concepts: https://docs.tide.org/Core-Concepts/core-concepts
- TideCloak Quorum Governance: https://docs.tide.org/Core-Concepts/iga-workflow
- TideCloak Forseti Policy: https://docs.tide.org/Core-Concepts/forseti-engine
- TideCloak E2EE Setup: https://docs.tide.org/Admin/e2ee
- SecureDrop Overview (đối chứng sản phẩm đã có): https://securedrop.org/overview/

**Tuyên bố trung thực:** Tài liệu là **concept và product requirements**. Các bảo đảm kỹ thuật nêu dưới dạng mục tiêu thiết kế, chỉ trở thành tuyên bố về tính năng khi có triển khai TideCloak và kết quả kiểm thử phù hợp. Không sử dụng người tố giác hay chứng cứ thật cho bản hackathon demo.
