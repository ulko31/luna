// Publicly supplied OOOPS portfolio sources. No private student or admin data.
export const portfolioResources = {
  stankevich:{title:'Кружок Станкевича',category:'Сайт · дизайн',description:'Дизайн образовательного сайта',color:'#b4d6ef',fileId:'1mKu_jfvLNsOIY1wSai16EVEi5xoqj8uh',kind:'pdf',localParts:10},
  starostin:{title:'Старостин',category:'Сайт · дизайн',description:'Дизайн сайта, полная версия проекта',color:'#efe1c9',fileId:'1dbkSTDrS5E4oEQ5n-igg0BCBVbLVvwPk',kind:'pdf',localParts:6},
  artcorpus:{title:'АртКорпус',category:'Графический дизайн',description:'Визуальная система проекта',color:'#e4cbe5',fileId:'1fpTnCLM2d4vuI6G-r6brxhEEFlYCnBCG',kind:'pdf',localPdf:'/assets/portfolio/artcorpus.pdf'},
  deepsweep:{title:'Deep Sweep Agency',category:'Дизайн · агентство',description:'Видеодемонстрация проекта агентства',color:'#d9d4ee',fileId:'1RZ_J9oxxzFUsY2Zl33TzLK-f1h-nq3z1',kind:'video',localVideo:'/assets/portfolio/deepsweep.mp4'},
  glasses:{title:'Очки',category:'Веб-дизайн · Сайт',description:'Демонстрация сайта и дизайна очков',color:'#cee7df',fileId:'1AKrd1xaOV0HyU-o6VSxfxNx2K7qrUmhD',kind:'video',localVideo:'/assets/portfolio/glasses.mp4'},
  muf:{title:'MUF',category:'Прототип · продуктивность',description:'Приложение для планирования времени и фокус-сессий',color:'#d7d9f5',fileId:'11odcii1XRUEiWpl64QBLunBDSjLrblGG',kind:'video',localVideo:'/assets/portfolio/pomodoro.mp4'},
  espachicas:{title:'Espachicas',category:'Сайт · дизайн',description:'Дизайн сайта',color:'#f3d7da',fileId:'1n_2K6UniNkg7bYDMUz1K3oNOj_GBqXUl',kind:'pdf'},
  brics:{title:'БРИКС',category:'Дизайн · презентация',description:'Визуальная работа',color:'#e2e7f1',fileId:'1gAsj8K4W0Mytu9hGTYpVJf3LHF-1Bbo3',kind:'pdf'}
};
export const portfolioResourceUrl = r => 'https://drive.google.com/file/d/'+r.fileId+'/preview';
export const portfolioPageUrl = r => 'https://drive.google.com/file/d/'+r.fileId+'/view';
