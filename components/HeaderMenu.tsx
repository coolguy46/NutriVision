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
import { MenuIcon } from 'lucide-react';

interface FriendData {
  email?: string;
  goalsCompleted?: boolean;
  uid: string;
  profilePicture?: string;
  streak: number;
}
interface HeaderMenuProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}
const HeaderMenu: React.FC<HeaderMenuProps> = ({ isOpen, setIsOpen }) => {
  const router = useRouter();
  const { user, signOutUser } = useAuth();
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [friendsFeed, setFriendsFeed] = useState<{ name: string; goalCompleted: boolean; uid: string; profilePicture: string; streak: number; }[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  
  const [isNewUser, setIsNewUser] = useState(false);
  const [showPointer, setShowPointer] = useState(false);

 
  useEffect(() => {
    const checkNewUser = async () => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid, 'recommendations', 'daily');
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            
            setIsNewUser(false);
          
          } else {
            setIsNewUser(true);
            setTimeout(() => setShowPointer(true), 1000);
          }
        } catch (error) {
          console.error('Error checking new user status:', error);
        }
      }
    };

    checkNewUser();
  }, [user]);
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsOpen(!mobile); // Auto-open on desktop
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [user, setIsOpen]);
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

  


  const menuItems = [
    { icon: HomeIcon, text: 'Home', path: '/' },
    { icon: UserIcon, text: 'Set Goals', path: '/goals' },
    { icon: CalendarIcon, text: 'Meal Plans', path: '/meals-plan' },
    { icon: UserGroupIcon, text: 'Friends', path: '/add-friends' },
    { icon: Cog6ToothIcon, text: 'Settings', path: '/settings' },
  ];

  const navigateTo = (path: string) => {
    if (path === '/goals') setShowPointer(false);
    router.push(path);
    if (isMobile) setIsOpen(false);
  };

  const GoalPointer = () => {
    if (!showPointer) return null;
    return (
      <div className="absolute -right-4 top-1/2 -translate-y-1/2 animate-bounce pointer-events-none">
        <div className="relative flex items-center">
          <div className="bg-primary text-white px-3 py-1.5 rounded-lg shadow-lg text-sm whitespace-nowrap mr-2">
            Start here! 🎯
          </div>
          <div className="w-2 h-2 bg-primary transform rotate-45" />
        </div>
      </div>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Profile Section */}
      <div className="px-4 py-6 border-b">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profilePicture || undefined} alt="Profile" />
            <AvatarFallback>{user?.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-medium">{user?.displayName || user?.email}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <div key={item.path} className="relative">
              <Button
                className={`w-full justify-start ${isNewUser && item.path === '/goals' ? 'animate-pulse' : ''}`}
                onClick={() => navigateTo(item.path)}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.text}
              </Button>
              {isNewUser && item.path === '/goals' && <GoalPointer />}
            </div>
          ))}
        </nav>

        {/* Friends Feed */}
        <div className="mt-6">
          <h4 className="text-sm font-medium px-2 mb-2">Friends Activity</h4>
          <div className="space-y-2">
            {friendsFeed.map((friend) => (
              <div key={friend.uid} className="flex items-center p-2 rounded-md hover:bg-accent">
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage src={friend.profilePicture} alt={friend.name} />
                  <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{friend.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {friend.goalCompleted ? 'Completed goals' : 'In progress'}
                  </p>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="ml-2 flex items-center space-x-1">
                        <FaFire className="text-orange-500" />
                        <span>{friend.streak}</span>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Daily streak: {friend.streak} days</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>

      {/* Sign Out Button */}
      <div className="border-t p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={signOutUser}
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-50 lg:hidden"
          onClick={() => setIsOpen(true)}
        >
          <MenuIcon className="h-6 w-6" /> {/* Make sure to import MenuIcon */}
        </Button>
      )}

      {/* Sidebar */}
      {isMobile ? (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent side="left" className="p-0 w-[300px]">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      ) : (
        <div className={`fixed inset-y-0 left-0 w-[300px] border-r bg-background transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <SidebarContent />
        </div>
      )}
</>
  );
};

export default HeaderMenu;