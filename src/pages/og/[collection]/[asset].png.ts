import type { APIRoute, GetStaticPaths } from "astro";
import { getProjects, getPublishedWriting } from "../../../data/content";
import {
  getProjectSocialCard,
  getWritingSocialCard,
  type SocialCardInput,
} from "../../../data/social-cards";
import { renderSocialCard } from "../../../utils/render-social-card";

interface Props {
  input: SocialCardInput;
}

export const getStaticPaths: GetStaticPaths = async () => {
  const [projects, writing] = await Promise.all([getProjects(), getPublishedWriting()]);
  const assets = [...projects.map(getProjectSocialCard), ...writing.map(getWritingSocialCard)];

  return assets.map(({ collection, asset, input }) => ({
    params: { collection, asset },
    props: { input } satisfies Props,
  }));
};

export const GET: APIRoute<Props> = async ({ props }) =>
  new Response(await renderSocialCard(props.input), {
    headers: {
      "Content-Type": "image/png",
    },
  });
