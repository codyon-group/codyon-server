# CodyOn(코디온)
패션을 주제로 개성을 표현하고, 영감을 주고 받는 것을 장려하는 패션 커뮤니티 플랫폼

## 기술 스택
NestJs, Typescript, Prisma, Postgresql, Redis, AWS(EC2, S3, CloudFront), Docker, Github-Action

## 주요 기능
- 자신만의 코디 사진을 공유
- 소유하고 있는 아이템들을 공유
- 패션 MBTI를 바탕으로 자신의 스타일과 유사한 사람들과의 소통
- 댓글과 좋아요를 통한 자유로운 소통
- 랭킹과 추천시스템으로 인한 유행하는 스타일 노출

## 개발 규칙
### Name
- 디렉토리 명은 kebab-case `ex) card wallet은 card-wallet`
- 파일 명은 kebab-case와 .(dot)으로 명명 `ex) card-wallet.module.ts, card-wallet.service.ts`

### Branch
- Feat : 새로운 기능 작업 시 feat 브랜치 사용 `ex) feat/기능`
- Fix : 추가한 기능이 main | develop에 머지된 후 수정사항이 발견된 경우 fix 브랜치 사용 `ex) fix/기능`

### Commit
- commit의 시작은 branch의 종류 `ex) feat: test code 추가`
- commit의 마지막은 작업과 관련된 이슈의 번호를 태그 `ex) feat: test code 추가 #이슈 번호`

## DB ERD
![image](https://github.com/user-attachments/assets/826afa6f-4900-424e-8502-4ae3e18bee81)
