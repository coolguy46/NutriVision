import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { HomeIcon, UserIcon, ChartBarIcon, CalendarIcon, UserGroupIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { FaFire } from 'react-icons/fa';



interface FriendData {
  email?: string;
  goalsCompleted?: boolean;
  uid: string;
  profilePicture?: string;
  streak : number;
}

const HeaderMenu: React.FC = () => {
  const router = useRouter();
  const { user, signOutUser } = useAuth();
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [friendsFeed, setFriendsFeed] = useState<{ name: string; goalCompleted: boolean; uid: string; profilePicture: string; streak : number; }[]>([]);
  const [isMobile, setIsMobile] = useState(false);
 

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            setProfilePicture(data.profilePicture || null);
          }
        } catch (error) {
          console.error('Error fetching user profile picture:', error);
        }
      }
    };

    fetchUserProfile();
  }, [user]);

  useEffect(() => {
    const fetchFriendsFeed = async () => {
      if (user) {
        try {
          const friendsQuery1 = query(
            collection(db, 'friend_requests'),
            where('status', '==', 'accepted'),
            where('from', '==', user.uid)
          );

          const friendsQuery2 = query(
            collection(db, 'friend_requests'),
            where('status', '==', 'accepted'),
            where('to', '==', user.uid)
          );

          const [querySnapshot1, querySnapshot2] = await Promise.all([
            getDocs(friendsQuery1),
            getDocs(friendsQuery2)
          ]);

          const friendsData = await Promise.all([
            ...querySnapshot1.docs,
            ...querySnapshot2.docs
          ].map(async (docSnap) => {
            const friendId = docSnap.data().from === user.uid ? docSnap.data().to : docSnap.data().from;
            const friendDoc = doc(db, 'users', friendId);
            const friendSnapshot = await getDoc(friendDoc);

            const friendData = friendSnapshot.data() as FriendData;

            return {
              name: friendData?.email || 'Friend',
              goalCompleted: friendData?.goalsCompleted || false,
              uid: friendData?.uid,
              profilePicture: friendData?.profilePicture || '/default-profile.png',
              streak : friendData?.streak || 0
            };
          }));

          setFriendsFeed(friendsData);
        } catch (error) {
          console.error('Error fetching friends feed:', error);
        }
      }
    };

    fetchFriendsFeed();
  }, [user]);

  const navigateTo = (path: string) => {
    router.push(path);
  };

  const menuItems = [
    { icon: HomeIcon, text: 'Home', path: '/' },
    { icon: UserIcon, text: 'Set Goals', path: '/goals' },
    { icon: CalendarIcon, text: 'Meal Plans', path: '/meals-plan' },
    { icon: UserGroupIcon, text: 'Add Friends', path: '/add-friends' },
  ];

  const MenuIcon: React.FC<{ icon: React.ElementType, className?: string }> = ({ icon: Icon, className }) => (
    <Icon className={`h-5 w-5 ${className}`} />
  );

  const FriendsFeed: React.FC = () => (
    <ScrollArea className="h-[300px] w-[250px]">
      {friendsFeed.length > 0 ? (
        friendsFeed.map((friend) => (
          <div key={friend.uid} className="flex items-center p-2 hover:bg-gray-100">
            <Avatar className="h-8 w-8 mr-2">
              <AvatarImage src={friend.profilePicture} alt={friend.name} />
              <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <TooltipProvider>
            <Tooltip>
                            <TooltipTrigger asChild>
                                <Badge variant="outline" className="flex items-center space-x-1">
                                    <FaFire className="text-orange-500" />
                                    <span>{friend.streak}</span>
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Daily streak: {friend.streak} days</p>
                            </TooltipContent>
                        </Tooltip>
                        </TooltipProvider>
            <div>
              <p className="text-sm font-medium">{friend.name}</p>
              <p className="text-xs text-gray-500">
                {friend.goalCompleted ? 'Goal Completed' : 'In Progress'}
              </p>
            </div>
          </div>
          
        ))
      ) : (
        <p className="text-sm text-gray-500 p-2">No friend updates</p>
      )}
    </ScrollArea>
  );

  return (
    <header className="fixed top-0 left-0 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 border-b">
      <div className="container mx-auto flex justify-between items-center h-16 px-4">
        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <MenuIcon icon={HomeIcon} className="h-6 w-6 dark:text-white" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[400px]">
            <nav className="flex flex-col gap-4">
              {menuItems.map((item, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start dark:text-white"
                  onClick={() => navigateTo(item.path)}
                >
                  <MenuIcon icon={item.icon} className="mr-2 dark:text-white" />
                  {item.text}
                </Button>
              ))}
              <Separator />
              <Button
                variant="ghost"
                className="w-full justify-start dark:text-white"
                onClick={() => navigateTo('/settings')}
              >
                <MenuIcon icon={Cog6ToothIcon} className="mr-2" />
                Settings
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start dark:text-white"
                onClick={signOutUser}
              >
                <MenuIcon icon={ArrowRightOnRectangleIcon} className="mr-2" />
                Sign Out
              </Button>
            </nav>
          </SheetContent>
        </Sheet>

        {/* Desktop menu */}
        <nav className="hidden lg:flex space-x-4">
          {menuItems.map((item, index) => (
            <Button
              key={index}
              variant="ghost"
              className="flex items-center space-x-2"
              onClick={() => navigateTo(item.path)}
            >
              <MenuIcon icon={item.icon} />
              <span>{item.text}</span>
            </Button>
          ))}
        </nav>

        {/* Right side menu items */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex"
            onClick={() => navigateTo('/settings')}
          >
            <MenuIcon icon={Cog6ToothIcon} className="h-5 w-5" />
          </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MenuIcon icon={UserGroupIcon} className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <FriendsFeed />
              </DropdownMenuContent>
            </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profilePicture || undefined} alt="Profile" />
                  <AvatarFallback>{user?.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigateTo('/customize-profile')}>
                Customize Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={signOutUser}>
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default HeaderMenu;