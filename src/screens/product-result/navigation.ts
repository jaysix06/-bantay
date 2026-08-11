type ProductResultRouter = {
  back: () => void;
  canGoBack: () => boolean;
  replace: (href: '/scan') => void;
};

export function returnFromProductResult(router: ProductResultRouter) {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace('/scan');
}
