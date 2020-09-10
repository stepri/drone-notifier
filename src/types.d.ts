interface Repo {
  active: true;
  updated: number;
  slug: string;
}

interface User {
  id: number;
  login: string;
}

interface Build {
  id: number;
  number: number;
  author_login: string;
  sender: string;
  status: string;
  message: string;
  source: string;
}