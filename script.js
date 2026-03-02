
const paintings = [
  {
    image: "images/vattenfall.jpg",
    title: "Vattenfall",
    description: "Där vattnet möter klippan och tiden står stilla."
  },
  {
    image: "images/womanOfTheSea.jpg",
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
    image: "images/semesterPåStrand.jpg",
    title: "Beach day",
    description: "Semester på strand."
  },

   {
    image: "images/självporträtt.jpg",
    title: "Embrace",
    description: "Självpoträtt som visar förändring och ett nytt liv."
  },
   {
    image: "images/bröllopspresent.jpg",
    title: "Bröllop",
    description: "Brollopsdag present till Herr och Fru Elfqvist."
  },
   {
    image: "images/mystiskJul.jpg",
    title: "Det är fortfarande tänt",
    description: "Mystisk jultomten."
  },

   {
    image: "images/näckrosor.jpg",
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
    image: "images/vårkänsla.JPG",
    title: "Vårkänsla",
    description: "Körsbärsblommor och en trött blåmes som vilar"
  },
   {
    image: "images/norrsken.jpg",
    title: "Norrsken",
    description: "Norrsken bakom bergerna."
    },
     {
    image: "images/herrOchFruAndersson.jpg",
    title: "Herr och Fru Andersson",
    description: "Gräsänder i sjön"
  },
   {
    image: "images/vargen.jpg",
    title: "Två sidor av samma mynt",
    description: "Målning som visar balans och styrka"
  },
   {
    image: "images/solnedgång.JPG",
    title: "Havet",
    description: "Solnedgång i havet"
  },
   {
    image: "images/rådjur.jpg",
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
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");

paintings.forEach(painting => {
  const card = document.createElement("div");
  card.classList.add("card");

  const img = document.createElement("img");
  img.src = painting.image;
  img.alt = painting.title;

  // 👉 KLICK = öppna lightbox
  img.addEventListener("click", () => {
    lightbox.style.display = "flex";
    lightboxImg.src = painting.image;
    lightboxImg.alt = painting.title;
  });

  const title = document.createElement("h3");
  title.textContent = painting.title;

  const desc = document.createElement("p");
  desc.textContent = painting.description;

  card.appendChild(img);
  card.appendChild(title);
  card.appendChild(desc);

  gallery.appendChild(card);
});

// 4️⃣ Klick på bakgrunden = stäng lightbox
lightbox.addEventListener("click", () => {
  lightbox.style.display = "none";
  lightboxImg.src = "";

});
