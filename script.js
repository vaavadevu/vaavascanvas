
const paintings = [
  {
    image: "images/Image1.jpg",
    title: "Vattenfall",
    description: "Där vattnet möter klippan och tiden står stilla."
  },
  {
    image: "images/Image2.jpg",
    title: "Woman of the Sea",
    description: "En självpoträtt 'inspirerad av hopp."
  },
  {
    image: "images/Image3.jpg",
    title: "Sovven och Bonnie",
    description: "Illustration somv var en present till bebisen i bildenpå hennes ett års födelsedag"
  },
  {
    image: "images/Image4.jpg",
    title: "Sommarstuga",
    description: "En somrig dag i Småland"
  },
   {
    image: "images/Image5.jpg",
    title: "Beach day",
    description: "Semester på strand"
  },

   {
    image: "images/Image6.jpg",
    title: "Embrace",
    description: "Självpoträtt som visar förändring och ett nytt liv."
  },
   {
    image: "images/Image7.jpg",
    title: "The Union",
    description: "Brollopsdag present till Herr och Fru Elfqvist."
  },
   {
    image: "images/Image8.jpg",
    title: "Det är fortfarande tänt",
    description: "Mystisk jultomten"
  },

   {
    image: "images/Image9.jpg",
    title: "Ska vi plocka blommor",
    description: "Still sjö med blommor"
  },
   {
    image: "images/Image10.jpg",
    title: "Vinterlek",
    description: "Hundarna Shiro och Otis som leker med varandra i snön"
  },
   {
    image: "images/Image11.jpg",
    title: "Dags att gå hem",
    description: "Savanna temad berättelse"
  },
   {
    image: "images/Image12.jpg",
    title: "Blåmes",
    description: "Körsbärsblommoroch en liten fågel som vilar"
  },
   {
    image: "images/Image13.jpg",
    title: "Himmeln som dansar",
    description: "Norrsken bakom bergerna"
    },
     {
    image: "images/Image14.jpg",
    title: "Herr och Fru Andersson",
    description: "Gräsandar i sjön"
  },
   {
    image: "images/Image15.jpg",
    title: "Två sidor av samma mynt",
    description: "Målning visar balans och styrka"
  },
   {
    image: "images/Image16.jpg",
    title: "Havet",
    description: "Solnedgång i havet"
  },
   {
    image: "images/Image17.jpg",
    title: "Bete",
    description: "Rådjur som betar i savanna"
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