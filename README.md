# onuri

## 작업실 음악

미니 플레이어는 `js/audio-player.js`, `css/audio-player.css`로 구성됩니다.
음원은 `audio/` 폴더의 `hanok-morning.mp3`, `moonlight-palace.mp3`,
`dokkaebi-walk.mp3`, `pungryu-jazz.mp3`, `Rain_on_Paper_Windows.mp3`(처마 끝 빗방울),
`Bamboo_Courtyard_Noon.mp3`(대숲의 오후), 총 6곡을 사용합니다.
기본 음량은 5%이며 이전 버전의 음량은 한 번 초기화합니다. 이후 직접 조절한 음량은 저장합니다.
사용자가 재생을 시작하면 선택한 한 곡/전체 순서 반복 방식으로 이어집니다.
재방문 시 마지막 선택 곡과 음량을 복원하며 자동 재생하지 않습니다.
곡 제목과 분위기 설명은 스크립트의 `tracks` 목록에서 수정할 수 있습니다.
GitHub Pages 배포 시 HTML, CSS, JavaScript와 `audio/` 폴더를 함께 업로드합니다.

동작 검사: `node --test tests/audio-player.test.cjs`

프로필 사진은 `image` 폴더에 각각 넣습니다.

- 상단: `profile1.jpg` (또는 jpeg/png/webp/gif)
- 하단 “Let's make something”: `profile2.jpg` (또는 jpeg/png/webp/gif)

각 사진은 독립적으로 적용되며, 해당 파일이 없으면 이니셜(HM)이 표시됩니다.
