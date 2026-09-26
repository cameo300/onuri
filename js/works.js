/*
  MY WORKS 관리 파일
  ------------------------------------------------------------
  1. image 폴더에 work-01.jpg, work-02.png ... 처럼 이미지를 넣습니다.
  2. 아래 작품 정보를 원하는 대로 수정합니다.
  3. 이미지 파일명은 work-번호 형식만 맞추면 자동으로 표시됩니다.

  category는 반드시 다음 중 하나를 사용하세요:
  ai / 3d / laser / resin / stationery
*/

const worksMeta = {
  1: {
    title: "AI Character Goods",
    category: "ai",
    tags: ["AI", "캐릭터", "굿즈"],
    description: "생성형 AI로 만든 캐릭터를 나만의 굿즈로 제작"
  },
  2: {
    title: "3D Printed Keyring",
    category: "3d",
    tags: ["3D PRINT", "키링", "Bambu"],
    description: "디지털 디자인으로 제작한 3D 프린팅 키링"
  },
  3: {
    title: "Acrylic Character",
    category: "laser",
    tags: ["LASER", "아크릴", "각인"],
    description: "레이저 각인과 커팅으로 완성한 아크릴 굿즈"
  },
  4: {
    title: "Lithophane Mood Lamp",
    category: "3d",
    tags: ["3D PRINT", "리쏘페인", "무드등"],
    description: "사진을 입체적인 빛으로 표현한 리쏘페인 작품"
  },
  5: {
    title: "Resin Art",
    category: "resin",
    tags: ["RESIN", "UV RESIN", "오브제"],
    description: "UV 레진으로 완성한 컬러풀한 창작 작품"
  },
  6: {
    title: "Custom Name Tag",
    category: "laser",
    tags: ["LASER", "네임택", "커스텀"],
    description: "나만의 이름과 디자인으로 만든 커스텀 굿즈"
  },
  7: {
    title: "Digital Planner",
    category: "stationery",
    tags: ["DIGITAL STATIONERY", "플래너", "아이패드"],
    description: "기록과 일정을 나만의 스타일로 정리하는 디지털 플래너"
  },
  8: {
    title: "Digital Note",
    category: "stationery",
    tags: ["DIGITAL STATIONERY", "노트", "기록"],
    description: "아이디어와 일상을 기록하기 위한 디지털 노트 디자인"
  },
  9: {
    title: "Digital Sticker",
    category: "stationery",
    tags: ["DIGITAL STATIONERY", "스티커", "굿노트"],
    description: "플래너와 노트를 꾸미는 나만의 디지털 스티커 제작"
  }
};
