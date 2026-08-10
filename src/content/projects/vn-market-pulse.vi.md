---
title: VN Market Pulse
description: Pipeline nghiên cứu web tiếng Việt với model output có kiểu rõ ràng, deadline cụ thể và nội dung gắn với nguồn.
outcome: Một workflow nghiên cứu giao quyết định ngữ nghĩa cho model, còn code xác định giới hạn runtime và validation.
lang: vi
translationKey: vn-market-pulse
slug: vn-market-pulse
role: Tự thiết kế và xây dựng toàn bộ
period: 07/2026
status: completed
statusLabel: Đã hoàn thành
featured: false
order: 2
topics:
  - applied-ai
  - reliability
stack:
  - Python
  - PydanticAI
  - Streamlit
links:
  repository: https://github.com/ToGiaBaoKDL/vn-market-pulse
---

## Bối cảnh

VN Market Pulse nghiên cứu một chủ đề tại Việt Nam và tạo một bài Facebook có dẫn nguồn. Mục tiêu không phải xây thêm một tập hợp ranking heuristic, mà là định nghĩa contract hẹp giữa quyết định ngữ nghĩa của model và kiểm soát deterministic của application.

## Pipeline

Ứng dụng lập kế hoạch tìm kiếm, thu thập metadata pool có giới hạn, để model chọn nguồn cần extract, đọc nội dung do provider trích xuất và viết một bài đã validate cùng chính xác các source ID được sử dụng.

PydanticAI chịu trách nhiệm typed output, validation, self-correction có giới hạn và usage accounting. Application code chịu trách nhiệm deadline, retrieval budget, transport retry hữu hạn, chuẩn hóa URL và diagnostic đã loại dữ liệu nhạy cảm.

## Quyết định thiết kế

Hệ thống không thêm BM25, MMR hoặc fusion heuristic ở local. Model nhận toàn bộ candidate pool có giới hạn và chịu trách nhiệm semantic selection. Code deterministic chỉ làm những gì có thể chứng minh: loại ngày không hợp lệ, chuẩn hóa URL, áp budget và kiểm tra reference.

Cách này giữ trách nhiệm rõ ràng. Nó cũng đồng nghĩa chất lượng phụ thuộc model và dữ liệu provider, vì vậy dự án không đưa ra claim thiếu kiểm chứng về accuracy hoặc giảm hallucination.

## Kết quả

Dự án đã hoàn thành với giao diện CLI và Streamlit, typed output, budget theo provider, deadline propagation, validation và automated test cho các application contract.
