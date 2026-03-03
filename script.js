
const paintings = [
   {
    image: "images/herrOchFruAndersson.JPG",
    title: "Herr och Fru Andersson",
    description: "Gräsänder i sjön",
    size: "60 x 90 cm",
    originalPrice: 3000,
    status: "SÅLD",
  },
  {
    image: "images/womanInTheSea.jpg",
    title: "Woman of the Sea",
    description: "En självpoträtt inspirerad av hopp.",
    size: "60 x 90 cm",
    originalPrice: 2000,
    status: "TILL SALU",
  },
  {
    image: "images/vattenfall.jpg",
    title: "Vattenfall",
    description: "Där vattnet möter klippan och tiden står stilla.",
    size: "41 x 33 cm",
    originalPrice: 1000,
    status: "SÅLD",
  },
  
 {
    image: "images/solnedgång.JPG",
    title: "Havet",
    description: "Solnedgång i havet",
    size: "41 x 33 cm",
    originalPrice: 1000,
    status: "TILL SALU",
  },

  {
    image: "images/sommarstuga.jpg",
    title: "Sommarstuga",
    description: "En somrig dag i Småland.",
    size: "42 x 59 cm",
    originalPrice: 1500,
    status: "TILL SALU",
  },

   {
    image: "images/sommarPåStranden.jpg",
    title: "Beach day",
    description: "Semester på strand.",
    size: "42 x 59 cm",
    originalPrice: 1800,
    status: "TILL SALU",
  },

   {
    image: "images/självporträtt.jpg",
    title: "Embrace",
    description: "Självpoträtt som visar förändring och ett nytt liv.",
    size: "42 x 59 cm",
    originalPrice: 1500,
    status: "TILL SALU",
  },
  

   {
    image: "images/mystiskJul.jpg",
    title: "Det är fortfarande tänt",
    description: "Mystisk jultomten.",
    size: "42 x 59 cm",
    originalPrice: 1500,
    status: "TILL SALU",
  },

   {
    image: "images/näckrosor.jpg",
    title: "Ska vi plocka blommor",
    description: "Stilla sjö med blommor",
    size: "42 x 59 cm",
    originalPrice: 1500,
    status: "SÅLD",
  },
   
   {
    image: "images/savannan.jpg",
    title: "Dags att gå hem",
    description: "Savanna temad berättelse",
    size: "42 x 59 cm",
    originalPrice: 1500,
    status: "TILL SALU",
  },
   {
    image: "images/vårkänsla.JPG",
    title: "Vårkänsla",
    description: "Körsbärsblommor och en trött blåmes som vilar",
    size: "42 x 59 cm",
    originalPrice: 1500,
    status: "SÅLD",
  },
   {
    image: "images/norrsken.jpg",
    title: "Norrsken",
    description: "Norrsken bakom bergerna.",
    size: "41 x 33 cm",
    originalPrice: 1000,
    status: "TILL SALU",
  },
     
   {
    image: "images/vargen.jpg",
    title: "Två sidor av samma mynt",
    description: "Målning som visar balans och styrka",
    size: "42 x 59 cm",
    originalPrice: 1500,
    status: "TILL SALU",
  },
   
   {
    image: "images/rådjur.jpg",
    title: "Savannan",
    description: "Antiloper som betar i savanna",
    size: "42 x 59 cm",
    originalPrice: 1500,
    status: "TILL SALU",
  },

  {
    image: "images/skogsvila.jpg",
    title: "Skogsvila",
    description: "Rävarna som myser innuti en trädöppning",
    size: "90 cm",
    originalPrice: 3000,
    status: "TILL SALU",
  },

   {
    image: "images/bröllopspresent.jpg",
    title: "Bröllop",
    description: "Brollopsdag present till Herr och Fru Elfqvist.",
    size: "42 x 59 cm",
    status: "Personlig present",
  },
  
  {
    image: "images/bonnie.jpg",
    title: "Sovven och Bonnie",
    description: "Illustration som var en present till bebisen i bilden på hennes ett års födelsedag",
    size: "42 x 59 cm", 
    status: "Personlig present",
  },

  {
    image: "images/shiroOchOtis.jpg",
    title: "Vinterlek",
    description: "Hundarna Shiro och Otis som leker med varandra i snön",
    size: "42 x 59 cm",
    status: "Personlig present",
  },
];

const gallery = document.getElementById("gallery");
const modal = document.getElementById("modal");
let modalImg, modalTitle, modalSize, modalDesc, modalButtons, modalClose, modalNext, modalPrev;
if (modal) {
  modalImg = document.getElementById("modal-img");
  modalTitle = document.getElementById("modal-title");
  modalSize = document.getElementById("modal-size");
  modalDesc = document.getElementById("modal-desc");
  modalButtons = document.getElementById("modal-buttons");
  modalClose = document.getElementById("modal-close");
  modalNext = document.getElementById("modal-next");
  modalPrev = document.getElementById("modal-prev");
}

let currentIndex = 0;

// Skapa gallery
if (gallery) {
  paintings.forEach((painting, index) => {
    const item = document.createElement("div");
    item.classList.add("gallery-item");

    const img = document.createElement("img");
    img.src = painting.image;
    img.alt = painting.title;

    img.addEventListener("click", () => openModal(index));

    item.appendChild(img);

    if (painting.status === "SÅLD") {
      const badge = document.createElement("div");
      badge.textContent = "Såld";
      badge.classList.add("sold-badge");
      item.appendChild(badge);
    }

    gallery.appendChild(item);
  });
}

// Öppna modal
function openModal(index) {
  if (!modal) return;
  currentIndex = index;
  const painting = paintings[index];
  modalImg.src = painting.image;
  modalTitle.textContent = painting.title;
  modalSize.textContent = painting.size;
  modalDesc.textContent = painting.description;

  modalButtons.innerHTML = "";

  if (painting.status === "SÅLD") {
    const soldText = document.createElement("p");
    soldText.textContent = "Såld";
    soldText.style.color = "red";
    modalButtons.appendChild(soldText);
  }

  else if (painting.status === "Personlig present") {
    const personalText = document.createElement("p");
    personalText.textContent = "Personlig målning – ej till salu";
    personalText.style.opacity = "0.8";
    modalButtons.appendChild(personalText);
  }

  else {
    if (painting.originalPrice) {
      const btnOriginal = document.createElement("button");
      btnOriginal.textContent = `Original – ${painting.originalPrice} kr`;
      modalButtons.appendChild(btnOriginal);
    }

    if (painting.printPrice) {
      const btnPrint = document.createElement("button");
      btnPrint.textContent = `Print – ${painting.printPrice} kr`;
      modalButtons.appendChild(btnPrint);
    }
  }
  modal.style.display = "flex";
}

// Stäng modal
function closeModal() {
  if (!modal) return;
  modal.style.display = "none";
}

// Next / Prev
function nextPainting() {
  currentIndex = (currentIndex + 1) % paintings.length;
  openModal(currentIndex);
}
function prevPainting() {
  currentIndex = (currentIndex - 1 + paintings.length) % paintings.length;
  openModal(currentIndex);
}
modalNext.addEventListener("click", nextPainting);
modalPrev.addEventListener("click", prevPainting);

// ESC key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
  if (e.key === "ArrowRight") nextPainting();
  if (e.key === "ArrowLeft") prevPainting();
});

// Klicka utanför bilden stänger modal
if (modal) {
  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (modalNext) modalNext.addEventListener("click", nextPainting);
  if (modalPrev) modalPrev.addEventListener("click", prevPainting);
  // Klicka utanför bilden stänger modal
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
}