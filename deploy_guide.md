# 🥐 깃허브 페이지(GitHub Pages) 배포 상세 가이드

이 문서는 Git이나 GitHub을 처음 사용하시는 분들도 쉽게 따라 하실 수 있도록 차근차근 정리한 배포 가이드입니다. 

---

## 1단계: GitHub 가입 및 로그인하기
1. **[GitHub 공식 홈페이지](https://github.com/)**에 접속합니다.
2. 회원가입(Sign up)을 완료하고 로그인을 합니다.
3. 본인의 **깃허브 아이디**: `gys3888`

---

## 2단계: GitHub에 코드 보관함(Repository) 만들기
1. 로그인 후 우측 상단의 초록색 **[New]** 버튼 또는 **[Create repository]** 링크를 클릭합니다.
2. 설정을 다음과 같이 입력합니다:
   - **Repository name**: `prompt-bakery` (영어 소문자와 대시`-` 조합)
   - **Public / Private**: 반드시 **Public**(공개)을 선택해 주세요. (무료 배포를 위해 필수입니다.)
   - 다른 옵션들(Add a README file 등)은 전부 **체크 해제**한 채로 둡니다.
3. 맨 아래에 있는 초록색 **[Create repository]** 버튼을 클릭합니다.
4. 새로 만들어진 페이지가 나타나며, 아래와 같은 주소가 표시됩니다. 이 주소를 복사해 둡니다:
   `https://github.com/gys3888/prompt-bakery.git`

---

## 3단계: 내 컴퓨터 코드와 GitHub 연결하기 (최초 1회만 수행)
터미널을 열고 다음 명령어를 한 줄씩 차례대로 입력합니다.

1. **프로젝트 폴더로 이동**:
   ```bash
   cd "/Users/yongseokgo/Downloads/prompt maker"
   ```
2. **Git 초기화 (내 폴더를 Git 저장소로 지정)**:
   ```bash
   git init
   ```
3. **배포할 파일들을 모두 스테이징(선택)**:
   ```bash
   git add .
   ```
4. **저장 메시지와 함께 첫 기록 남기**:
   ```bash
   git commit -m "첫 번째 커밋"
   ```
5. **기본 브랜치 이름을 `main`으로 변경**:
   ```bash
   git branch -M main
   ```
6. **로컬 폴더와 GitHub 저장소 연결**:
   ```bash
   git remote add origin https://github.com/gys3888/prompt-bakery.git
   ```
7. **GitHub에 코드 올리기** (최초 업로드):
   ```bash
   git push -u origin main
   ```
   *(깃허브 보안 로그인 창이 뜰 수 있으며, 깃허브 계정으로 인증해 주시면 됩니다.)*

---

## 4단계: `gh-pages` 패키지 설치 및 환경 설정

1. **배포 도구 설치**:
   터미널에서 아래 명령어를 입력하여 깃허브 배포를 돕는 도구를 설치합니다:
   ```bash
   npm install gh-pages --save-dev
   ```

2. **`package.json` 파일 수정하기**:
   이미 완료되었습니다! `package.json` 파일에 `"homepage"` 및 `"scripts"` 배포 명령어 설정을 마쳤습니다.

---

## 5단계: 배포 실행하기 🚀
설정이 모두 끝났습니다! 이제 터미널에 아래 명령어만 입력하면 배포가 자동으로 수행됩니다:

```bash
npm run deploy
```

### 무슨 일이 일어나나요?
1. `"predeploy"` 스크립트가 실행되어 코드를 최신화하고 `dist` 폴더에 배포용 빌드 파일을 새로 뽑아냅니다.
2. `"deploy"` 스크립트가 빌드된 `dist` 폴더의 내용을 내 GitHub 저장소의 `gh-pages`라는 특수 브랜치에 자동으로 업로드합니다.
3. 터미널 창에 `Published`라고 뜨면 배포 완료입니다!

---

## 6단계: 결과 확인하기 🌐
1. 배포 후 약 1~2분 정도 기다립니다.
2. 설정한 주소인 `https://gys3888.github.io/prompt-bakery` 로 접속해 봅니다!
3. 만약 화면이 보이지 않는다면:
   - 깃허브 저장소(`https://github.com/gys3888/prompt-bakery`)로 이동합니다.
   - 상단 메뉴 중 **[Settings]** 탭을 누릅니다.
   - 왼쪽 메뉴에서 **[Pages]**를 클릭합니다.
   - **Build and deployment** 항목의 **Branch** 부분이 `gh-pages` 및 `/ (root)`로 잘 선택되어 있는지 확인해 주세요! (대부분 자동으로 세팅됩니다.)
