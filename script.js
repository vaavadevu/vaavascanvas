
const paintings = [
  {
    image: "images/vattenfall.jpg",
    title: "Vattenfall",
    description: "Där vattnet möter klippan och tiden står stilla.",
    size: "41 x 33 cm",
  },
  {
    image: "images/womanInTheSea.jpg",
    title: "Woman of the Sea",
    description: "En självpoträtt inspirerad av hopp."
  },
  {
    image: "images/bonnie.jpg",
    title: "Sovven och Bonnie",
    description: "Illustration som var en present till bebisen i bilden på hennes ett års födelsedag"
  },
  {
    image: "images/sommarstuga.jpg",
    title: "Sommarstuga",
    description: "En somrig dag i Småland."
  },
   {
    image: "images/sommarP%C3%A5Stranden.jpg",
    title: "Beach day",
    description: "Semester på strand."
  },

   {
    image: "images/sj%C3%A4lvportr%C3%A4tt.jpg",
    title: "Embrace",
    description: "Självpoträtt som visar förändring och ett nytt liv."
  },
   {
    image: "images/br%C3%B6llopspresent.jpg",
    title: "Bröllop",
    description: "Brollopsdag present till Herr och Fru Elfqvist."
  },
   {
    image: "images/mystiskJul.jpg",
    title: "Det är fortfarande tänt",
    description: "Mystisk jultomten."
  },

   {
    image: "images/n%C3%A4ckrosor.jpg",
    title: "Ska vi plocka blommor",
    description: "Stilla sjö med blommor"
  },
   {
    image: "images/shiroOchOtis.jpg",
    title: "Vinterlek",
    description: "Hundarna Shiro och Otis som leker med varandra i snön"
  },
   {
    image: "images/savannan.jpg",
    title: "Dags att gå hem",
    description: "Savanna temad berättelse"
  },
   {
    image: "images/v%C3%A5rk%C3%A4nsla.JPG",
    title: "Vårkänsla",
    description: "Körsbärsblommor och en trött blåmes som vilar"
  },
   {
    image: "images/norrsken.jpg",
    title: "Norrsken",
    description: "Norrsken bakom bergerna."
    },
     {
    image: "images/herrOchFruAndersson.JPG",
    title: "Herr och Fru Andersson",
    description: "Gräsänder i sjön"
  },
   {
    image: "images/vargen.jpg",
    title: "Två sidor av samma mynt",
    description: "Målning som visar balans och styrka"
  },
   {
    image: "images/solnedg%C3%A5ng.JPG",
    title: "Havet",
    description: "Solnedgång i havet"
  },
   {
    image: "images/r%C3%A5djur.jpg",
    title: "Savannan",
    description: "Antiloper som betar i savanna"
  },

  {
    image: "images/skogsvila.jpg",
    title: "Skogsvila",
    description: "Rävarna som myser innuti en trädöppning"
  },
];

const gallery = document.getElementById("gallery");
const modal = document.getElementById("modal");
const modalImg = document.getElementById("modal-img");
const modalTitle = document.getElementById("modal-title");
const modalSize = document.getElementById("modal-size");
const modalDesc = document.getElementById("modal-desc");
const modalButtons = document.getElementById("modal-buttons");
const modalClose = document.getElementById("modal-close");
const modalNext = document.getElementById("modal-next");
const modalPrev = document.getElementById("modal-prev");

let currentIndex = 0;

// Skapa gallery
paintings.forEach((painting, index) => {
  const item = document.createElement("div");
  item.classList.add("gallery-item");

  const img = document.createElement("img");
  img.src = painting.image;
  img.alt = painting.title;

  img.addEventListener("click", () => openModal(index));

  item.appendChild(img);
  gallery.appendChild(item);
});

// Öppna modal
function openModal(index) {
  currentIndex = index;
  const painting = paintings[index];
  modalImg.src = painting.image;
  modalTitle.textContent = painting.title;
  modalSize.textContent = painting.size;
  modalDesc.textContent = painting.description;

  // Rensa gamla knappar
  modalButtons.innerHTML = "";
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

  modal.style.display = "flex";
}

// Stäng modal
function closeModal() {
  modal.style.display = "none";
}
modalClose.addEventListener("click", closeModal);

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
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});