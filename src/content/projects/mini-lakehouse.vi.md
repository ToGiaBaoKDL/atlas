---
title: Mini Lakehouse
description: Nền tảng lakehouse cá nhân đã deploy đầy đủ, bao gồm hạ tầng cloud, catalog contracts, orchestration, analytics và xử lý tài liệu bằng GPU.
outcome: Một lakehouse cá nhân đã deploy đầy đủ với ranh giới sở hữu độc lập cho hạ tầng, dữ liệu và quy trình triển khai.
lang: vi
translationKey: mini-lakehouse
slug: mini-lakehouse
role: Tự thiết kế và xây dựng toàn bộ
period: 07/2026 — Hiện tại
status: maintained
statusLabel: Đã deploy & đang duy trì
featured: true
order: 1
topics:
  - data-platforms
  - lakehouse
  - cloud-infrastructure
  - reliability
stack:
  - Apache Iceberg
  - AWS
  - Airflow
  - dbt
  - Terraform
  - OCI
links:
  repository: https://github.com/ToGiaBaoKDL/mini-lakehouse
---

## Bối cảnh

Mini Lakehouse là nền tảng dữ liệu cá nhân do tôi tự xây dựng và đã deploy đầy đủ. Tôi bắt đầu dự án từ một câu hỏi thực tế: một nền tảng nhỏ có thể giữ ranh giới sở hữu và triển khai theo chuẩn production mà không mang theo toàn bộ chi phí vận hành của một tổ chức lớn hay không?

Data plane trên AWS được tách khỏi services host riêng trên Oracle Cloud. Airflow điều phối workload Spark, dbt và xử lý tài liệu; S3 cùng Apache Iceberg tạo thành lớp lưu trữ; Glue cung cấp catalog; Athena và các ứng dụng dữ liệu nhỏ phục vụ dữ liệu đầu ra.

## Các ràng buộc

- Kiểm soát chi phí cloud và chỉ dùng compute đắt tiền khi cần.
- Không mở public ingress vào services host.
- Không lưu cloud credential dài hạn trong CI hoặc runtime.
- Data job phải chạy lại an toàn.
- Mỗi boundary có thể deploy và rollback độc lập.
- Local development vẫn phải dễ hiểu dù có nhiều môi trường chạy khác nhau.

## Kiến trúc và quyền sở hữu

Nền tảng được chia theo trách nhiệm, không chia theo danh sách công nghệ.

| Boundary                   | Trách nhiệm                                                  |
| -------------------------- | ------------------------------------------------------------ |
| Terraform                  | Hạ tầng AWS, OCI, Tailscale, GitHub và Cloudflare            |
| YAML contracts + PyIceberg | Glue databases, Iceberg tables và kiểm tra drift             |
| Spark jobs                 | Trích xuất nguồn, xuất bản landing và curated transforms     |
| OCR workers                | Thực thi GPU từ xa và xuất bản dữ liệu tài liệu              |
| dbt domains                | Analytics tables, tests và vòng đời release                  |
| Airflow                    | Chỉ điều phối; business logic nằm trong runtime sở hữu riêng |

Cách tách này ngăn orchestrator biến thành application và không để infrastructure state trở thành nguồn sự thật của catalog.

## Quyết định: catalog contracts thay vì Terraform tables

Terraform tạo hạ tầng và các container cần thiết cho catalog, nhưng không tạo Glue databases hoặc Iceberg tables. Các object này được khai báo bằng YAML contract có version và được reconcile qua control plane PyIceberg.

Trade-off là phải duy trì thêm một control-plane component nhỏ. Đổi lại, ranh giới sở hữu rõ hơn: table evolution, storage layout và compatibility checks nằm cạnh data contract thay vì nằm trong infrastructure state.

## Đường đi của dữ liệu và workload

Spark xuất bản landing partition theo đường dẫn xác định trước và ghi curated tables. Khi chạy lại một khoảng thời gian authoritative, partition landing tương ứng được thay thế trước khi mutation mới nhất được merge vào curated.

Luồng tài liệu được tách riêng. Airflow khởi chạy worker image đã pin; worker gửi job GPU từ xa, stream log, kiểm tra artifact, ghi curated output và chỉ commit Iceberg run record ở bước cuối. Provider SDK và OCR library không được cài vào Airflow.

Mỗi dbt domain chỉ đọc curated input thuộc quyền sở hữu của nó, đồng thời có runtime identity, model, test, image và vòng đời release riêng.

## Triển khai và rollback

Pull request chỉ validate các component bị ảnh hưởng. Sau khi merge được review, workflow xuất bản image hoặc EMR artifact bất biến theo Git commit SHA. GitHub đổi OIDC token lấy credential ngắn hạn nên CI không lưu AWS access key, Tailscale OAuth secret hoặc SSH private key.

Một EMR release chỉ hoàn tất khi entrypoint, locked dependency, contract bundle và checksum manifest đều đã được upload. Sau đó CI mới cập nhật một SSM pointer theo cách atomic. Partial upload có thể sửa; revision đã hoàn tất thì bất biến và có thể tái sử dụng.

Rollback kiểm tra target digest thuộc về một revision đã được review. Airflow, từng dbt domain, Inspector và OCR có thể thay đổi độc lập thay vì bị khóa vào một platform release duy nhất.

## Bảo mật và vận hành

Services host không có public ingress. Tailscale cung cấp đường truy cập cho operator; Cloudflare Access và Tunnel bảo vệ các dịch vụ mở trên trình duyệt. Runtime secret chỉ được materialize cho đúng service sử dụng nó.

Workflow bảo trì compact các Iceberg partition gần đây, expire snapshot và xóa orphan file đủ cũ. Catalog validation báo object cũ thuộc ownership của platform nhưng không tự động xóa.

## Kết quả hiện tại

Toàn bộ topology đã được deploy và đang được duy trì như một nền tảng cá nhân. Hệ thống hiện hỗ trợ analytics cho hoạt động GitHub, dữ liệu nghiên cứu arXiv, OCR tài liệu và workflow kiểm tra dữ liệu chỉ đọc.

Chi phí và workload metric sẽ chỉ được thêm khi tôi có quy trình đo lường có thể lặp lại.

## Điều tôi sẽ thay đổi

Nền tảng chủ động tối ưu cho ranh giới rõ ràng. Đổi lại, số deployment surface và lượng tài liệu nhiều hơn một stack chạy trên một máy. Nếu workload tiếp tục nhỏ và ngắn hạn, tôi sẽ gộp bớt một số runtime boundary. Nếu hệ thống phát triển, tôi sẽ giữ ownership model hiện tại nhưng tăng cường service-level telemetry và công bố benchmark chi phí/hiệu năng có thể tái lập.
