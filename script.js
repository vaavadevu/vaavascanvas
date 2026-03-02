
const paintings = [
  {
    image: "images/vattenfall.jpg",
    title: "Vattenfall",
    description: "Där vattnet möter klippan och tiden står stilla."
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
// 2️⃣ Element
const gallery = document.getElementById("gallery");
const modal = document.getElementById("artModal");
const modalImg = document.getElementById("modalImg");
const modalTitle = document.getElementById("modalTitle");
const modalDesc = document.getElementById("modalDesc");
const modalBuy = document.getElementById("modalBuy");
const modalClose = document.getElementById("modalClose");

// 3️⃣ Skapa galleribilder
paintings.forEach(painting => {
  const img = document.createElement("img");
  img.src = painting.image;
  img.alt = painting.title;
  img.style.cursor = "pointer";
  img.style.height = "300px";
  img.style.objectFit = "cover";
  img.style.margin = "5px";

  img.addEventListener("click", () => {
    // Öppna modal
    modal.style.display = "flex";
    modalImg.src = painting.image;
    modalTitle.textContent = painting.title;
    modalDesc.textContent = painting.description;

    // Storlek
    let sizeHTML = painting.size ? `<p>Storlek: ${painting.size}</p>` : "";

    // Köp-knappar
    let buyHTML = "";
    if(painting.originalPrice) buyHTML += `<button>Köp original – ${painting.originalPrice} kr</button>`;
    if(painting.printPrice) buyHTML += `<button>Köp print – ${painting.printPrice} kr</button>`;

    modalBuy.innerHTML = sizeHTML + buyHTML;
  });

  gallery.appendChild(img);
});

// 4️⃣ Stäng modal
modalClose.addEventListener("click", () => {
  modal.style.display = "none";
  modalImg.src = "";
});

modal.addEventListener("click", (e) => {
  if(e.target === modal) modal.style.display = "none";
});