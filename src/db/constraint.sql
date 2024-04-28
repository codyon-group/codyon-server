-- schema.prisma로 적용할 수 없는 제약조건 실행

ALTER TABLE "like"
ADD CONSTRAINT category
CHECK (category in ('LOOKBOOK', 'FASHION_CARD', 'COMMENT'));