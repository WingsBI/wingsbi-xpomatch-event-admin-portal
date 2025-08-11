/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/iframe/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' *",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      // Hide event-admin role from URLs
      {
        source: '/:identifier/dashboard',
        destination: '/:identifier/event-admin/dashboard',
      },
      {
        source: '/:identifier/meetings',
        destination: '/:identifier/event-admin/meetings',
      },
      {
        source: '/:identifier/schedule-meeting',
        destination: '/:identifier/event-admin/meetings/schedule-meeting',
      },
      {
        source: '/:identifier/visitors',
        destination: '/:identifier/event-admin/visitors',
      },
      {
        source: '/:identifier/visitors/matching',
        destination: '/:identifier/event-admin/visitors/matching',
      },
      {
        source: '/:identifier/exhibitors',
        destination: '/:identifier/event-admin/exhibitors',
      },
      {
        source: '/:identifier/exhibitors/matching',
        destination: '/:identifier/event-admin/exhibitors/matching',
      },
      {
        source: '/:identifier/exhibitors/exhibitor_details',
        destination: '/:identifier/event-admin/exhibitors/exhibitor_details',
      },
      {
        source: '/:identifier/favourites',
        destination: '/:identifier/event-admin/favourites',
      },
      {
        source: '/:identifier/participants-cards',
        destination: '/:identifier/event-admin/participants-cards',
      },
      {
        source: '/:identifier/profile',
        destination: '/:identifier/event-admin/profile',
      },
      // Dashboard sub-routes
      {
        source: '/:identifier/dashboard/exhibitor_dashboard',
        destination: '/:identifier/event-admin/dashboard/exhibitor_dashboard',
      },
      {
        source: '/:identifier/dashboard/exhibitor_dashboard/exhibitor_details',
        destination: '/:identifier/event-admin/dashboard/exhibitor_dashboard/exhibitor_details',
      },
      {
        source: '/:identifier/dashboard/visitor_dashboard',
        destination: '/:identifier/event-admin/dashboard/visitor_dashboard',
      },
    ];
  },
};

module.exports = nextConfig; 