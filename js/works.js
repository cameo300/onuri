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
    category: "3d",
    tags: ["AI", "3D PRINT", "캐릭터", "굿즈"],
    description: "생성형 AI로 만든 캐릭터를 나만의 굿즈로 제작"
  },
  2: {
    title: "3D Printed Keyring",
    category: "3d",
    tags: ["AI", "3D PRINT", "키링", "Bambu"],
    description: "디지털 디자인으로 제작한 3D 프린팅 키링"
  },
  3: {
    title: "Acrylic Character",
    category: "laser",
    tags: ["AI", "LASER", "아크릴", "각인"],
    description: "레이저 각인과 커팅으로 완성한 아크릴 굿즈"
  },
  4: {
    title: "Lithophane Mood Lamp",
    category: "3d",
    tags: ["AI", "3D PRINT", "리쏘페인", "무드등"],
    description: "사진을 입체적인 빛으로 표현한 리쏘페인 작품"
  },
  5: {
    title: "Resin Art",
    category: "resin",
    tags: ["RESIN", "UV RESIN"],
    description: "UV 레진으로 완성한 컬러풀한 창작 작품"
  },
  6: {
    title: "Resin Art",
    category: "resin",
    tags: ["RESIN", "UV RESIN"],
    description: "UV 레진으로 완성한 컬러풀한 창작 작품2"
  },
  7: {
    title: "Wood & Resin Puzzle",
    category: "laser",
    tags: ["AI", "LASER", "WOOD", "PUZZLE", "RESIN"],
    description: "원목에 레이저로 새긴 빈티지 일러스트를 퍼즐로 구성하고, 투명 레진으로 마감"
  },
  8: {
    title: "Wooden Bluetooth Speaker",
    category: "laser",
    tags: ["LASER", "WOOD", "BLUETOOTH", "캐릭터", "각인"],
    description: "목공 블루투스 스피커에 레이저로 캐릭터를 각인해, 나무의 따뜻한 질감과 나만의 개성을 담은 오디오"
  },
  9: {
    title: "My Personal Statue",
    category: "3d",
    tags: ["AI", "3D PRINTING", "캐릭터"],
    description: "나의 모습을 입체 조형으로 구현하고 3D 프린터로 출력해 완성한 세상에 하나뿐인 나만의 동상"
  },
  10: {
    title: "Custom Pencil Holder",
    category: "3d",
    tags: ["3D PRINTING", "CUSTOM"],
    description: "원하는 모델을 선택해서 스펠링과 크기를 조절하고 3D 프린터로 출력해, 나만의 취향에 맞춘 커스텀 연필꽂이"
  },
  11: {
    title: "Christmas Character Goods",
    category: "3d",
    tags: ["AI", "3D PRINT", "캐릭터", "굿즈"],
    description: "내 캐릭터로 크리스마스를 위한 2D 회전 장식 제작"
  },
  12: {
    title: "Character Flexi Keyring & Clicker",
    category: "3d",
    tags: ["3D PRINTING", "FLEXI", "CLICKER", "캐릭터 굿즈"],
    description: "유연하게 움직이는 플렉시 키링과 클리커로 완성한 커스텀 굿즈"
  },
  13: {
    title: "Wood & Resin Art",
    category: "laser",
    tags: ["AI", "LASER", "캐릭터", "각인", "RESIN"],
    description: "나무합판에 레이저로 새긴 캐릭터와 레진으로 꾸미기 제작"
  },
  14: {
    title: "Digital Planner",
    category: "stationery",
    tags: ["DIGITAL STATIONERY", "디지털문구", "플래너", "굿노트"],
    description: "기록과 일정을 나만의 스타일로 정리하는 디지털 플래너"
  },
  15: {
    title: "Digital Note",
    category: "stationery",
    tags: ["DIGITAL STATIONERY", "디지털문구", "노트", "굿노트"],
    description: "아이디어와 일상을 기록하기 위한 디지털 노트 디자인"
  }
};
