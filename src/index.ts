import {
  doRequest, sendNotification
} from './util';

const intervalInSeconds = parseInt(process.env.DRONE_INTERVAL, 2) || 8;

const cachedBuilds = {} as { [key: string]: Build[]; };

async function handler() {
  try {
    const user = await doRequest('/api/user') as User;

    const repos = await doRequest('/api/user/repos?latest=true') as Repo[];
    const activeRepos = repos.filter(repo => repo.active);

    for (const repoIndex in activeRepos) {
      if (!activeRepos.hasOwnProperty(repoIndex)) {
        continue;
      }
      const repo = repos[repoIndex];

      const builds = await doRequest(`/api/repos/${repo.slug}/builds?page=1`) as Build[];
      const buildsFromUser = builds.filter(build => build.author_login === user.login);
      if (buildsFromUser.length === 0) {
        continue;
      }

      console.log(`Checking repo ${repo.slug}`);

      if (!cachedBuilds[repo.slug] || cachedBuilds[repo.slug].length === 0) {
        cachedBuilds[repo.slug] = buildsFromUser;
      }

      for (const buildId in buildsFromUser) {
        if (!buildsFromUser.hasOwnProperty(buildId)) {
          continue;
        }
        const build = buildsFromUser[buildId];

        const cachedBuild = cachedBuilds[repo.slug].find(b => b.id === build.id);
        if (!cachedBuild) {
          sendNotification(
            `${repo.slug} - ${build.source}`,
            `Started new build!`,
            `/${repo.slug}/${build.number}`)
          continue;
        }

        if (build.status === cachedBuild.status) {
          continue;
        }

        sendNotification(
          `${repo.slug} - ${build.source}`,
          `${cachedBuild.status} -> ${build.status}`,
          `/${repo.slug}/${build.number}`)
      }

      cachedBuilds[repo.slug] = buildsFromUser;
    }

    console.log(`Retry in ${intervalInSeconds} seconds`);
    setTimeout(handler, intervalInSeconds * 1000);
  } catch (error) {
    console.error(error);
  }

}

(async () => {
  if (!process.env.DRONE_HOST) {
    console.error('please provider a drone host');
    return;
  }

  if (!process.env.DRONE_API_KEY) {
    console.error('please provider a api key');
    return;
  }

  await handler()
})();